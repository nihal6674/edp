from flask import request, jsonify
from models.hospital_model import Hospital

def register_hospital():
    data = request.get_json()
    result = Hospital.register_hospital(data)
    return jsonify(result), (200 if "hospital_id" in result else 400)

def login_hospital():
    data = request.get_json()
    result = Hospital.authenticate_hospital(
        data.get("email"),
        data.get("password")
    )
    # Changed to check for "data" in response instead of "hospital_id"
    return jsonify(result), (200 if "data" in result else 401)

def logout_hospital():
    return jsonify({"success": True, "message": "Logged out successfully!"}), 200