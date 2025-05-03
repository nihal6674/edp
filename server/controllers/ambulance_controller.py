from flask import request, jsonify
from models.ambulance_model import Ambulance
from config import db
import logging

def register_ambulance():
    """Registers an ambulance."""
    data = request.json
    result = Ambulance.register_ambulance(data)
    return jsonify(result), (200 if "ambulance_id" in result else 400)

def login_ambulance():
    """Authenticates an ambulance login."""
    data = request.json
    result = Ambulance.authenticate_ambulance(data.get("email"), data.get("password"))
    
    # Check for success differently based on your Ambulance class version
    if "message" in result and result["message"] == "Login successful":
        return jsonify(result), 200
    elif "ambulance_id" in result:  # For backward compatibility
        return jsonify(result), 200
    else:
        return jsonify(result), 401

def logout_ambulance():
    """Logs out an ambulance (for frontend session handling)."""
    return jsonify({"success": True, "message": "Logged out successfully!"}), 200



inventory_collection = db["inventory"]
ambulance_collection=db["ambulances"]
def get_ambulance_inventory():
    ambulance_id = request.args.get("ambulance_id")
    
    if not ambulance_id:
        return jsonify({"error": "ambulance_id is required"}), 400

    inventory = inventory_collection.find_one({"ambulance_id": ambulance_id})
    ambulance = ambulance_collection.find_one({"ambulance_id": ambulance_id})

    if not inventory:
        return jsonify({"error": "No inventory found for this ambulance"}), 404

    items = inventory.get("items", [])

    # Count critical items
    critical_item_count = sum(1 for item in items if item.get("type") == "critical")

    ambulance_type ="critical" if critical_item_count >= 2 else "non-critical"

    
    result = ambulance_collection.update_one(
    {"ambulance_id": str(ambulance_id)},
    {"$set": {"type": ambulance_type}}
)
    
    # Build response
    response = {
        "ambulance_id": ambulance_id,
        "ambulance_type":ambulance_type,
        "critical_item_count": critical_item_count,
        "items": items,
        "coin":result.modified_count
    }

    return jsonify(response), 200



def update_location():
    try:
        data = request.get_json()
        ambulance_id = data.get('ambulance_id')
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        # Validation
        if not ambulance_id or latitude is None or longitude is None:
            return jsonify({'error': 'ambulance_id, latitude, and longitude are required'}), 400

        # Call the model function to update location
        result = Ambulance.update_location_by_ambulance_id(ambulance_id, latitude, longitude)

        # Return result
        return jsonify(result), (200 if "message" in result else 404)

    except Exception as e:
        logging.error(f'Location update error: {str(e)}', exc_info=True)
        return jsonify({'error': 'Failed to update location'}), 500