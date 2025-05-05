from flask import request, jsonify
from config import db

scan_collection = db["scans"]

def change_mode():
    data = request.get_json()
    status = data.get("status")

    # ✅ Updated to include "weighted_refill"
    if status not in ["refill", "used", "weighted", "weighted_refill"]:
        return jsonify({"error": "Invalid status"}), 400

    scan_data = {
        "status": status,
    }

    # Check if a scan document already exists
    existing_scan = scan_collection.find_one({"status": {"$exists": True}})

    if existing_scan:
        scan_collection.update_one(
            {"_id": existing_scan["_id"]},
            {"$set": scan_data}
        )
        return jsonify({"message": f"Scan status updated to {status}", "current_status": status}), 200
    else:
        scan_collection.insert_one(scan_data)
        return jsonify({"message": f"Scan status set to {status}", "current_status": status}), 200
