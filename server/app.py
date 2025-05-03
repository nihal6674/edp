from flask import Flask, request, jsonify
from flask_cors import CORS
from config import db

# Import route Blueprints
from routes.ambulance_routes import ambulance_bp
from routes.inventory_routes import inventory_bp
from routes.patient_routes import patient_bp
from routes.hospital_routes import hospital_bp
from routes.allocation_routes import allocation_bp
from routes.alerts_routes import alerts_bp
from routes.request_routes import request_routes

from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enables CORS for all routes

# Register Blueprints
app.register_blueprint(ambulance_bp, url_prefix="/api/ambulance")
app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
app.register_blueprint(patient_bp, url_prefix="/api/patient")
app.register_blueprint(hospital_bp, url_prefix="/api/hospital")
app.register_blueprint(allocation_bp, url_prefix="/api")
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

# 📡 RFID UID receive endpoint
@app.route('/api/rfid', methods=['POST'])
def receive_rfid():
    data = request.get_json()
    tag_uid = data.get('uid')

    print(f"📡 Received Tag UID: {tag_uid}")
    # You can store this in MongoDB, log, or trigger actions

    return jsonify({"message": "RFID UID received", "uid": tag_uid}), 200

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)

