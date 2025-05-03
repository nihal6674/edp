import React, { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/authSlice";
import { useNavigate } from "react-router-dom";

const loginEndpoints = {
  ambulance: "http://localhost:5000/api/ambulance/login",
  patient: "http://localhost:5000/api/patient/login",
  hospital: "http://localhost:5000/api/hospital/login",
};

export default function LoginPage() {
  const [role, setRole] = useState("ambulance");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loginHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(loginEndpoints[role], { email, password });
      console.log(res.data);
      dispatch(loginSuccess({ role, details: res.data }));
      alert(res.data.message || "Login successful!");
      navigate(`/${role}/dashboard`);
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">🔐 Login</h2>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">User Role:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="ambulance">Ambulance</option>
            <option value="patient">Patient</option>
            <option value="hospital">Hospital</option>
          </select>
        </div>

        <form onSubmit={loginHandler} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
