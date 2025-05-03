from config import db
from werkzeug.security import generate_password_hash, check_password_hash

hospital_collection = db["hospitals"]

class Hospital:
    @staticmethod
    def register_hospital(data):
        required_fields = ["name", "email", "password", "location"]
        if not all(field in data for field in required_fields):
            return {"error": "Missing required fields"}

        if hospital_collection.find_one({"email": data["email"]}):
            return {"error": "Email already registered"}

        data["hospital_id"] = Hospital.generate_hospital_id()
        data["password"] = generate_password_hash(data["password"])
        hospital_collection.insert_one(data)

        return {
            "message": "Hospital registered successfully",
            "hospital_id": data["hospital_id"]
        }

    @staticmethod
    def authenticate_hospital(email, password):
        hospital = hospital_collection.find_one({"email": email})
        if hospital and check_password_hash(hospital["password"], password):
            return {
                "message": "Login successful",
                "data": {
                    "id": str(hospital["_id"]),
                    "name": hospital["name"],
                    "email": hospital["email"],
                    "role": "hospital",
                    "address":hospital["location"],
                    "hospital_id":hospital["hospital_id"],
                    "latitude":hospital["latitude"],
                    "longitude":hospital["longitude"],
                }
            }
        return {"error": "Invalid email or password"}

    @staticmethod
    def generate_hospital_id():
        last = hospital_collection.find_one(sort=[("hospital_id", -1)])
        if last and "hospital_id" in last:
            last_id = int(last["hospital_id"][1:])
            return f"H{last_id + 1:03d}"
        return "H001"
