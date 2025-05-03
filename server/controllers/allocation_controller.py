from flask import request, jsonify
from models.ambulance_model import ambulance_collection
from models.hospital_model import hospital_collection
from models.request_model import requests_collection
from models.patient_model import patient_collection
import openrouteservice
from dotenv import load_dotenv
import os

load_dotenv()

ORS_API_KEY = os.getenv("ORS_API_KEY")
client = openrouteservice.Client(key=ORS_API_KEY)

def get_eta(coord1, coord2):
    try:
        routes = client.directions(
            coordinates=[coord1, coord2],
            profile='driving-car',
            format='geojson'
        )
        return routes['features'][0]['properties']['summary']['duration']
    except Exception as e:
        print("ORS Error:", e)
        return float("inf")

def clean_doc(doc):
    """Remove MongoDB internal fields like _id and return a clean dict"""
    doc = dict(doc)
    doc.pop('_id', None)
    return doc

def allocate_ambulance_and_hospital():
    data = request.json
    patient_id = data["patient_id"]
    patient_coords = [data["longitude"], data["latitude"]]
    patient_type = data["type"]

    # Step 0: Fetch full patient info using custom patient_id
    patient = patient_collection.find_one({"patient_id": patient_id})
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    # Step 1: Find nearest hospital
    hospitals = list(hospital_collection.find({}))
    nearest_hospital = None
    min_dist = float("inf")

    for hospital in hospitals:
        hospital_coords = [hospital["longitude"], hospital["latitude"]]
        dist = get_eta(patient_coords, hospital_coords)
        if dist < min_dist:
            min_dist = dist
            nearest_hospital = hospital

    if not nearest_hospital:
        return jsonify({"message": "No hospitals found"}), 404

    hospital_coords = [nearest_hospital["longitude"], nearest_hospital["latitude"]]

    # Step 2: Find best ambulance
    ambulances = list(ambulance_collection.find({"availability": "free"}))
    selected_ambulance = None
    min_treatment_time = float("inf")

    for amb in ambulances:
        amb_type = amb["code"]
        amb_coords = [amb["longitude"], amb["latitude"]]

        to_patient = get_eta(amb_coords, patient_coords)
        to_hospital = get_eta(patient_coords, hospital_coords)

        if patient_type == "critical":
            if amb_type == "critical":
                treatment_time = to_patient
            else:
                treatment_time = to_patient + to_hospital
        else:
            if amb_type != "critical":
                treatment_time = to_patient
            else:
                continue

        if treatment_time < min_treatment_time:
            min_treatment_time = treatment_time
            selected_ambulance = amb

    if not selected_ambulance:
        return jsonify({"message": "No suitable ambulance found"}), 404

    # ✅ Step 3: Update ambulance status to busy
    ambulance_collection.update_one(
        {"ambulance_id": selected_ambulance["ambulance_id"]},
        {"$set": {"availability": "busy"}}
    )

    # ✅ Step 4: Update patient in_transit to 1
    patient_collection.update_one(
        {"patient_id": patient["patient_id"]},
        {"$set": {"in_transit": 1}}
    )

    # Re-fetch updated patient for clean output
    updated_patient = patient_collection.find_one({"patient_id": patient["patient_id"]})

    # ✅ Step 5: Save request with full objects (using custom IDs)
    request_doc = {
        "patient_id": updated_patient["patient_id"],
        "hospital_id": nearest_hospital["hospital_id"],
        "ambulance_id": selected_ambulance["ambulance_id"],
        "in_transit": 1,
        "patient": clean_doc(updated_patient),
        "hospital": clean_doc(nearest_hospital),
        "ambulance": clean_doc(selected_ambulance)
    }

    requests_collection.insert_one(request_doc)

    return jsonify({
        "message": "Ambulance and hospital allocated",
        "eta": round(min_treatment_time / 60, 2),  # in minutes
        "patient": clean_doc(updated_patient),
        "hospital": clean_doc(nearest_hospital),
        "ambulance": clean_doc(selected_ambulance)
    }), 200
