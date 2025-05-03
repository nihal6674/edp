import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./components/Login";
import SignupPage from "./components/Signup";
import AmbulanceDashboard from "./components/dashboards/AmbulanceDashboard";
import PatientDashboard from "./components/dashboards/PatientDashboard";
import HospitalDashboard from "./components/dashboards/HospitalDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/ambulance/dashboard" element={<AmbulanceDashboard />} />
      <Route path="/patient/dashboard" element={<PatientDashboard />} />
      <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
    </Routes>
  );
}
