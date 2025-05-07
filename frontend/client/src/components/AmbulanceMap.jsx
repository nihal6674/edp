import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import Routing from "./Routing";

// Custom icons
const ambulanceIcon = new L.Icon({
  iconUrl: "/ambulance.png",
  iconSize: [35, 35],
});

const patientIcon = new L.Icon({
  iconUrl: "/patient.png",
  iconSize: [35, 35],
});

const hospitalIcon = new L.Icon({
  iconUrl: "/hospital.png",
  iconSize: [35, 35],
});


const AmbulanceMap = () => {
  const { data } = useSelector((state) => state.request);

  const ambulance = data?.ambulance;
  const patient = data?.patient;
  const hospital = data?.hospital;

  const ambulanceLat = ambulance?.latitude || 0;
  const ambulanceLng = ambulance?.longitude || 0;
  const patientLat = patient?.latitude || null;
  const patientLng = patient?.longitude || null;
  const hospitalLat = hospital?.latitude || null;
  const hospitalLng = hospital?.longitude || null;

  const centerLat = patientLat || ambulanceLat;
  const centerLng = patientLng || ambulanceLng;

  return (
    <div className="mt-6 flex flex-col lg:flex-row gap-4">
      <div className="w-full lg:w-3/4 h-[400px] rounded-xl overflow-hidden shadow-md border border-gray-300">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
  
          <Marker position={[ambulanceLat, ambulanceLng]} icon={ambulanceIcon}>
            <Popup>🚑 Ambulance</Popup>
          </Marker>
  
          {patientLat && patientLng && (
            <Marker position={[patientLat, patientLng]} icon={patientIcon}>
              <Popup>🧍 Patient</Popup>
            </Marker>
          )}
  
          {hospitalLat && hospitalLng && (
            <Marker position={[hospitalLat, hospitalLng]} icon={hospitalIcon}>
              <Popup>🏥 Hospital</Popup>
            </Marker>
          )}
  
          {ambulanceLat && patientLat && hospitalLat && (
            <Routing
              from={[ambulanceLat, ambulanceLng]}
              via={[patientLat, patientLng]}
              to={[hospitalLat, hospitalLng]}
            />
          )}
        </MapContainer>
      </div>
  
      
    </div>
  );
  
};

export default AmbulanceMap;