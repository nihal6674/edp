import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/authSlice";

const HospitalDashboard = () => {
  const dispatch = useDispatch();
  const authData = useSelector((state) => state.auth);
  const currentHospitalId = authData?.details?.data?.hospital_id || "HOSP001";
  const [alerts, setAlerts] = useState([]);
  const [requests, setRequests] = useState([]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    window.location.href = "/login";
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/alerts/all?hospital_id=${currentHospitalId}`);
      setAlerts(res.data.reverse());
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/requests/hospital/${currentHospitalId}`);
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };

  const handleReceived = async (requestId, ambulanceId, patientId) => {
    try {
      await axios.post("http://localhost:5000/requests/mark-received", {
        request_id: requestId,
        ambulance_id: ambulanceId,
        patient_id: patientId
      });
      fetchRequests(); // Refresh list
    } catch (err) {
      console.error("Failed to mark received", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchRequests();
    const interval = setInterval(() => {
      fetchAlerts();
      fetchRequests();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentHospitalId]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🏥 Hospital Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Requests */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">🚑 Ambulance Requests</h2>
          {requests.length > 0 ? (
            requests.map((req, index) => (
              <div key={index} className="border-b p-3 flex justify-between items-center">
                <div>
                  <p><strong>Ambulance ID:</strong> {req.ambulance_id}</p>
                  <p><strong>Patient ID:</strong> {req.patient_id}</p>
                  <p><strong>ETA:</strong> {req.eta || "In Transit"}</p>
                </div>
                <button
                  onClick={() => handleReceived(req._id, req.ambulance_id, req.patient_id)}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Received
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No ambulance requests.</p>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">⚠️ Alerts</h2>
          {alerts.length > 0 ? (
            alerts.map((alert, index) => (
              <div key={index} className="border-b p-3">
                <p><strong>Ambulance ID:</strong> {alert.ambulance_id}</p>
                <p><strong>Patient ID:</strong> {alert.patient_id}</p>
                <p><strong>Message:</strong> {alert.alert_message}</p>
                <p className={`font-semibold ${alert.alert_type === "Low Inventory" ? "text-orange-500" : "text-blue-500"}`}>
                  {alert.alert_type}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No alerts.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
