import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";

export default function PatientPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [chats, setChats] = useState([]);
  const [patientDetails, setPatientDetails] = useState([]);
  const [showPatientInfo, setShowPatientInfo] = useState(false);
  const [allocationInfo, setAllocationInfo] = useState(null);

  const { isAuthenticated, details, role } = useSelector((state) => state.auth);
  const recognitionRef = useRef(null);

  function speakText(text) {
    if (!text || typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.5; // increased speed
    synth.speak(utter);
  }

  const startRecording = () => {
    try {
      const recognition = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleAnalysis(text);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      setIsRecording(true);
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Speech recognition not supported", err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const allocateResources = async (type) => {
    try {
      const payload = {
        name: details?.data?.name,
        email: details?.data?.email,
        latitude: details?.data?.latitude,
        longitude: details?.data?.longitude,
        type,
        patient_id: details?.data?.patient_id,
      };
      const res = await fetch("http://localhost:5000/api/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setAllocationInfo(data);
      if (!res.ok) throw new Error(data.message || "Allocation failed");
    } catch (err) {
      console.error("❌ Allocation Error:", err.message);
    }
  };

  const handleAnalysis = async (text) => {
    try {
      const loadingId = Date.now();
      setChats((prevChats) => [
        ...prevChats,
        {
          id: loadingId,
          user: text,
          bot: null,
          critical: null,
          loading: true,
        },
      ]);

      const classificationRes = await fetch(
        "http://127.0.0.1:5000/api/patient/classify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }
      );

      if (!classificationRes.ok) throw new Error("Classification API failed");

      const chatRes = await fetch("http://127.0.0.1:5000/api/patient/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!chatRes.ok) throw new Error("Chat API failed");

      const classification = await classificationRes.json();
      const chatResponse = await chatRes.json();

      const botMessage = chatResponse.response;
      const firstWord = classification.category.toLowerCase();
      const type = firstWord.startsWith("c") ? "critical" : "non-critical";

      await allocateResources(type);

      speakText(botMessage); // only speaks the bot's response

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === loadingId
            ? {
                ...chat,
                bot: botMessage,
                critical: classification.critical,
                loading: false,
              }
            : chat
        )
      );

      const newPatientDetail = {
        statement: text,
        type,
      };
      setPatientDetails((prev) => [...prev, newPatientDetail]);
      setShowChat(true);
    } catch (err) {
      console.error("API Error:", err);
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.loading
            ? {
                ...chat,
                bot: `Error: ${err.message}`,
                critical: false,
                loading: false,
              }
            : chat
        )
      );
      setShowChat(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <button
        onClick={() => setShowPatientInfo(!showPatientInfo)}
        className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded shadow-md hover:bg-blue-600 transition z-50"
      >
        Your Info
      </button>

      {allocationInfo && (
        <div className="mt-6 p-4 border border-gray-300 rounded-md bg-white shadow-lg w-full max-w-lg">
          <h3 className="text-xl font-bold mb-2 text-blue-600">
            🚑 Allocation Details
          </h3>
          <div className="mb-2">
            <h4 className="font-semibold">Hospital:</h4>
            <p>
              <strong>Type:</strong> {allocationInfo.hospital.hospital_id}
            </p>
            <p>
              <strong>Name:</strong> {allocationInfo.hospital.name}
            </p>
            <p>
              <strong>Location:</strong> {allocationInfo.hospital.location}
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Ambulance:</h4>
            <p>
              <strong>Type:</strong> {allocationInfo.ambulance.ambulance_id}
            </p>
            <p>
              <strong>Code:</strong> {allocationInfo.ambulance.code}
            </p>
            <p>
              <strong>Driver:</strong> {allocationInfo.ambulance.driver_name}
            </p>
            <p>
              <strong>Number Plate:</strong>{" "}
              {allocationInfo.ambulance.number_plate}
            </p>
          </div>
        </div>
      )}

      {showPatientInfo && details && (
        <div className="absolute top-20 left-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 w-full max-w-md">
          <h2 className="text-lg font-semibold mb-2">Patient Info</h2>
          <p>
            <strong>Name:</strong> {details.data.name}
          </p>
          <p>
            <strong>Email:</strong> {details.data.email}
          </p>
          <p>
            <strong>Latitude:</strong> {details.data.latitude}
          </p>
          <p>
            <strong>Longitude:</strong> {details.data.longitude}
          </p>
          <p>
            <strong>BloodGroup:</strong> {details.data.bloodGroup}
          </p>
          <button
            onClick={() => setShowPatientInfo(false)}
            className="mt-3 text-sm text-red-500 hover:underline"
          >
            Close
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className={`${
            isRecording ? "bg-red-600" : "bg-red-500"
          } text-white rounded-full p-6 text-lg font-bold hover:bg-red-600 transition-all duration-300 w-full sm:w-40 h-40 flex items-center justify-center shadow-xl hover:shadow-2xl`}
        >
          {isRecording ? "Recording..." : "EMERGENCY"}
        </button>

        {isRecording && (
          <button
            onClick={stopRecording}
            className="bg-gray-700 text-white rounded-full p-4 text-lg font-bold hover:bg-gray-800 transition-all duration-300 w-full sm:w-40 h-40 flex items-center justify-center shadow-xl hover:shadow-2xl"
          >
            STOP
          </button>
        )}
      </div>

      <div className="mt-6 w-full max-w-lg">
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Type your condition here..."
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => {
            handleAnalysis(manualInput);
            setManualInput("");
          }}
          className="mt-2 w-full bg-blue-500 text-white font-bold py-2 rounded-md hover:bg-blue-600 transition"
        >
          Send
        </button>
      </div>

      {showChat && (
        <div className="fixed bottom-4 right-4 w-full sm:w-[500px] max-h-[600px] bg-white border border-gray-300 shadow-lg rounded-lg overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-200">
            <h2 className="text-lg font-semibold">Chat with Assistant</h2>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-600"
            >
              ✖
            </button>
          </div>
          <div className="p-4 max-h-[520px] overflow-y-auto space-y-4">
            {chats.map((chat, index) => (
              <div key={index}>
                <p className="text-gray-800 font-semibold">
                  Patient: {chat.user}
                </p>
                <div
                  className={`mt-1 p-3 rounded-lg ${
                    chat.critical === true
                      ? "bg-red-100 border border-red-300"
                      : chat.critical === false
                      ? "bg-green-100 border border-green-300"
                      : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  {chat.loading ? (
                    <div className="w-full h-2 bg-gray-200 rounded overflow-hidden relative">
                      <div className="absolute top-0 left-0 h-full w-1/4 bg-blue-500 animate-loading-bar" />
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold">
                        {chat.critical
                          ? "CRITICAL - Dispatching ambulance!"
                          : "Non-critical assistance"}
                      </p>
                      <div className="mt-1 prose prose-sm max-w-full">
                        <ReactMarkdown>
                          {`**Bot:** ${chat.bot || " "}`}
                        </ReactMarkdown>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
