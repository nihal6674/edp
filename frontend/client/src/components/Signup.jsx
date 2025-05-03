import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const signupEndpoints = {
  ambulance: "http://localhost:5000/api/ambulance/register",
  patient: "http://localhost:5000/api/patient/register",
  hospital: "http://localhost:5000/api/hospital/register",
};

export default function SignupPage() {
  const [role, setRole] = useState("ambulance");
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          alert("Error getting location: " + error.message);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const signupHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(signupEndpoints[role], formData);
      alert(res.data.message || "Signup successful!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">🚑 Signup Page</h2>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">Role:</label>
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

        <form onSubmit={signupHandler} className="space-y-4">
          {(role !== "hospital" || role === "hospital") && (
            <input
              name="name"
              placeholder={role === "hospital" ? "Hospital Name" : "Name"}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          )}

          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          {role === "ambulance" && (
            <>
              <input
                name="driver_name"
                placeholder="Driver Name"
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              <input
                name="number_plate"
                placeholder="Number Plate"
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
             
            </>
          )}

          {role === "patient" && (
            <>
              <input
                name="address"
                placeholder="Address"
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              <input
                name="blood_group"
                placeholder="Blood Group"
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              <input
                name="gender"
                placeholder="Gender"
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </>
          )}

          {role === "hospital" && (
            <input
              name="location"
              placeholder="Location"
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={getLocation}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Get My Location
            </button>
            <input
              name="latitude"
              placeholder="Latitude"
              value={formData.latitude || ""}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <input
              name="longitude"
              placeholder="Longitude"
              value={formData.longitude || ""}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mt-2"
          >
            Signup
          </button>
        </form>
      </div>
    </div>
  );
}
