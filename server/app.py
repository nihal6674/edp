from flask import Flask, request, jsonify
from flask_cors import CORS
from config import db
from bson import ObjectId

# Import route Blueprints
from routes.ambulance_routes import ambulance_bp
from routes.inventory_routes import inventory_bp
from routes.patient_routes import patient_bp
from routes.hospital_routes import hospital_bp
from routes.allocation_routes import allocation_bp
from routes.alerts_routes import alerts_bp
from routes.request_routes import request_routes
from routes.scan_route import scan_bp
from models.scan_model import scan_collection
from models.item_model import Item  # Import the Item model
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

# Register Blueprints
app.register_blueprint(ambulance_bp, url_prefix="/api/ambulance")
app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
app.register_blueprint(patient_bp, url_prefix="/api/patient")
app.register_blueprint(hospital_bp, url_prefix="/api/hospital")
app.register_blueprint(allocation_bp, url_prefix="/api")
app.register_blueprint(scan_bp, url_prefix="/api/scan")
app.register_blueprint(alerts_bp, url_prefix="/alerts")
app.register_blueprint(request_routes)








# MongoDB Connection Check
try:
    db.list_collection_names()
    print("✅ MongoDB Connected Successfully!")
except Exception as e:
    print(f"❌ MongoDB Connection Failed: {e}")


# 🏠 Home route
@app.route('/')
def home():
    return "🚑 FastER Ambulance Management System is Running!"



# @app.route('/api/rfid', methods=['POST'])
# def receive_rfid():
#     data = request.get_json()
#     rfid_id = data.get('uid')

#     if not rfid_id:
#         return jsonify({"error": "No RFID received"}), 400

#     # Normalize UID formatting (strip spaces, convert to uppercase)
#     rfid_id = rfid_id.strip().upper()
#     print(f"📡 Received Tag UID: {rfid_id}")

#     # Example: Check if tag exists in the MongoDB collection
#     items_collection = db.items  # Replace 'items' with your actual collection name
    
#     # Check if the RFID UID exists in the MongoDB collection
#     item = items_collection.find_one({"rfid_id": rfid_id})

#     if item:
#         add_inventory_item("A001",{"id": item['id'],
#         "rfid_id": item['rfid_id'],
#         "name": item['name'],
#         "code": item['code'],
#         "type": item['type'],
#         "quantity":1})
#         return jsonify({
#             "message": "RFID UID received",
#             "RFID": rfid_id,
#             "item": {
#                 "id": item['id'],
#         "rfid_id": item['rfid_id'],
#         "name": item['name'],
#         "code": item['code'],
#         "type": item['type'],
#             }
#         }), 200
#     else:
#         return jsonify({
#             "message": "Unknown RFID UID",
#             "RFID": rfid_id
#         }), 404
    





# @app.route('/api/weight', methods=['POST'])
# def receive_weight():
#     data = request.get_json()
#     print("Received Weight:", data['weight'])
#     return jsonify({"status": "received", "weight": data['weight']}), 200

 

# 📦 Add Item route
@app.route('/api/items', methods=['POST'])
def include_item():
    data = request.get_json()

    # Validate incoming data
    if not all(key in data for key in ['id','rfid_id', 'name','code' , 'type']):
        return jsonify({"error": "Missing required fields"}), 400

    # Insert the new item into the MongoDB collection
    items_collection = db.items
    item_data = {
        "id": data['id'],
        "rfid_id": data['rfid_id'],
        "name": data['name'],
        "code": data['code'],
        "type": data['type'],
    }

    try:
        result = items_collection.insert_one(item_data)  # Insert into MongoDB
        return jsonify({
            "message": "Item added successfully!",
            "item_id": str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Function to serialize ObjectId to string
def serialize_object_id(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError("Type not serializable")


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)

