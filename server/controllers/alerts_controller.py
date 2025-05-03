from flask import request, jsonify
from models.alerts_model import alerts_collection
from bson import ObjectId

def create_alert(data):
    

    alert = {
        "ambulance_id": data["ambulance_id"],
        "patient_id": data["patient_id"],
        "hospital_id": data["hospital_id"],
        "alert_type": data["alert_type"],
        "alert_message": data["alert_message"],
        "flag": data["flag"]
    }

    inserted = alerts_collection.insert_one(alert)
    alert["_id"] = str(inserted.inserted_id)

    return jsonify({"message": "Alert created", "alert": alert}), 201


def get_alerts():
    hospital_id = request.args.get("hospital_id")

    query = {}
    if hospital_id:
        query["hospital_id"] = hospital_id

    alerts = list(alerts_collection.find(query))
    for alert in alerts:
        alert["_id"] = str(alert["_id"])

    return jsonify(alerts), 200
