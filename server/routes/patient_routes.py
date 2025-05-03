from flask import Blueprint
from controllers.patient_controller import register_patient, login_patient, logout_patient, classify, chat,update_location

patient_bp = Blueprint("patient_bp", __name__)

patient_bp.route("/register", methods=["POST"])(register_patient)
patient_bp.route("/login", methods=["POST"])(login_patient)
patient_bp.route("/logout", methods=["POST"])(logout_patient)
patient_bp.route("/classify", methods=["POST"])(classify)
patient_bp.route("/chat", methods=["POST"])(chat)
patient_bp.route("/location", methods=["POST"])(update_location)
