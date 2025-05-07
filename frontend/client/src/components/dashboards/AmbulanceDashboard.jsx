import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import axios from "axios";
import AmbulanceInventory from "./AmbulanceInventory";
import AmbulanceMap from "../AmbulanceMap";
import { logout } from "../../redux/authSlice";
import {
  setRequestLoading,
  setRequestSuccess,
  setRequestError,
  clearRequest
} from "../../redux/requestSlice";

const AmbulanceDashboard = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, details, role } = useSelector((state) => state.auth);
  const { requestStatus, data: assignment, status: reqState } = useSelector((state) => state.request);

  const ambulanceId = details?.data?.ambulance_id;

  const sendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          const payload = {
            ambulance_id: ambulanceId || "P010",
            latitude,
            longitude
          };

          try {
            await fetch("http://127.0.0.1:5000/api/ambulance/location", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
          } catch (error) {
            console.error("❌ Error sending location:", error);
          }
        },
        (error) => {
          console.error("❌ Geolocation error:", error.message);
        }
      );
    } else {
      console.warn("⚠️ Geolocation not supported.");
    }
  };


  // useEffect(() => {
//   // Call it once immediately
//   sendLocation();

//   // Set interval to call it every 5 minutes (300000 ms)
//   const interval = setInterval(() => {
//     sendLocation();
//   }, 180000); // 3 minutes in milliseconds

//   // Clear interval on component unmount
//   return () => clearInterval(interval);
// }, []);

  // Fetch request/assignment every 5s
  useEffect(() => {
    

    const fetchAssignment = async () => {
      if (!ambulanceId) return;
    
      try {
        const res = await axios.get(`http://localhost:5000/requests/ambulance?ambulance_id=${ambulanceId}`);
        if (res.data.status === "busy") {
          if (JSON.stringify(res.data.data) !== JSON.stringify(assignment)) {
            dispatch(setRequestSuccess(res.data));
          }
        } else {
          if (assignment !== null) dispatch(clearRequest());
        }
      } catch (error) {
        dispatch(setRequestError(error?.response?.data?.message || "Failed to fetch assignment."));
      }
    };
    


    
    fetchAssignment();
    const interval = setInterval(fetchAssignment, 5000);
    return () => clearInterval(interval);
  }, [ambulanceId, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearRequest());
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🚑 Ambulance Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Assignment Info */}
      <div className="mt-6 bg-white shadow-md rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-3">🚨 Current Assignment</h2>
        {reqState === "loading" ? (
          <p>Loading...</p>
        ) : requestStatus === "busy" ? (
          <div>
            <p><strong>Patient:</strong> {assignment?.patient?.name || "N/A"} ({assignment.patient_id})</p>
            <p><strong>Hospital:</strong> {assignment?.hospital?.name || "N/A"} ({assignment.hospital_id})</p>
            <p><strong>In Transit:</strong> {assignment.in_transit ? "Yes" : "No"}</p>
          </div>
        ) : (
          <p className="text-green-600 font-medium">✅ Ambulance is free.</p>
        )}
      </div>
      <div className="mt-6 h-[400px] w-full rounded-lg shadow overflow-hidden border border-gray-300">
      {requestStatus === "busy" && assignment ? (
  <div className="mt-6 h-[400px] w-full rounded-lg shadow overflow-hidden border border-gray-300">
    <AmbulanceMap />
  </div>
) : null}
</div>
      {/* Inventory */}
      <AmbulanceInventory />
    </div>
  );
};

export default AmbulanceDashboard;
