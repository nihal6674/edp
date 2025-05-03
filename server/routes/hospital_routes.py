from flask import Blueprint
from controllers.hospital_controller import register_hospital, login_hospital, logout_hospital

hospital_bp = Blueprint("hospital_bp", __name__)

hospital_bp.route("/register", methods=["POST"])(register_hospital)
hospital_bp.route("/login", methods=["POST"])(login_hospital)
hospital_bp.route("/logout", methods=["POST"])(logout_hospital)
