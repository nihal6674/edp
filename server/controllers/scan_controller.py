from flask import request, jsonify
from config import db

scan_collection = db["scans"]



def change_mode():
    data = request.get_json()
    status = data.get("status")

    # Validate the status
    if status not in ["refill", "used", "weighted"]:
        return jsonify({"error": "Invalid status"}), 400

    # Get the current timestamp

    # Create the new scan document to be inserted or updated
    scan_data = {
        "status": status,
    }

    # Check if the status document already exists
    existing_scan = scan_collection.find_one({"status": {"$exists": True}})  # Assuming we're updating the first document we find

    if existing_scan:
        # If an existing scan document is found, update it
        scan_collection.update_one(
            {"_id": existing_scan["_id"]},  # Find the document by its ObjectId
            {"$set": scan_data}  # Update the status and timestamp
        )
        return jsonify({"message": f"Scan status updated to {status}", "current_status": status}), 200
    else:
        # If no scan document exists, insert a new one
        scan_collection.insert_one(scan_data)
        return jsonify({"message": f"Scan status set to {status}", "current_status": status}), 200