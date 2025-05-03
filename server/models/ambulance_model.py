from config import db
from werkzeug.security import generate_password_hash, check_password_hash

ambulance_collection = db["ambulances"]  # MongoDB Collection

class Ambulance:
    @staticmethod
    def register_ambulance(data):
        """Registers a new ambulance with authentication."""

        # Required fields check
        required_fields = ["email", "password", "driver_name", "number_plate"]
        if not all(field in data for field in required_fields):
            return {"error": "Missing required fields"}

        # Check if email already exists
        if ambulance_collection.find_one({"email": data["email"]}):
            return {"error": "Email already registered"}

        # Generate unique ambulance ID
        data["ambulance_id"] = Ambulance.generate_ambulance_id()

        # Automatically set "code" to "non-critical"
        data["code"] = "non-critical" 
        data["availability"] = "free"
        
         

         
        
        # Hash password for security
        data["password"] = generate_password_hash(data["password"])

        # Insert into MongoDB
        ambulance_collection.insert_one(data)
        return {"message": "Ambulance registered successfully", "ambulance_id": data["ambulance_id"]}

    @staticmethod
    def authenticate_ambulance(email, password):
        """Authenticate an ambulance via email & password."""
        ambulance = ambulance_collection.find_one({"email": email})
        if ambulance and check_password_hash(ambulance["password"], password):
            return {"message": "Login successful", "data": {
                    "id": str(ambulance["_id"]),
                    "driver_name": ambulance["driver_name"],
                    "email": ambulance["email"],
                    "role": "ambulance",
                    "type":ambulance["code"],
                    "number_plate":ambulance["number_plate"],
                    "ambulance_id":str(ambulance["ambulance_id"]),
                    "latitude":ambulance["latitude"],
                    "longitude":ambulance["longitude"],
                }}
        return {"error": "Invalid email or password"}

    @staticmethod
    def generate_ambulance_id():
        """Generates a unique ambulance ID (A001, A002, etc.)."""
        last_ambulance = ambulance_collection.find_one(sort=[("ambulance_id", -1)])
        if last_ambulance and "ambulance_id" in last_ambulance:
            last_id = int(last_ambulance["ambulance_id"][1:])  # Extract number from "A001"
            return f"A{last_id + 1:03d}"  # Increment & format
        return "A001"  # Default first ID
    

    @staticmethod
    def update_location_by_ambulance_id(ambulance_id, latitude, longitude):
        if not ambulance_id or latitude is None or longitude is None:
            return {"error": "ambulance_id, latitude, and longitude are required"}

        ambulance = db.ambulances.find_one({"ambulance_id": ambulance_id})
        if not ambulance:
            return {"error": "ambulance not found"}

        db.ambulances.update_one(
            {"ambulance_id": ambulance_id},
            {"$set":  {"latitude": latitude, "longitude": longitude}}
        )
        return {"message": "Location updated successfully"}
    
