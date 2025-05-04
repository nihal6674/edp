from flask import Blueprint
from controllers.ambulance_controller import register_ambulance, login_ambulance, logout_ambulance, get_ambulance_inventory,update_location

ambulance_bp = Blueprint("ambulance_bp", __name__)

# Register Ambulance
ambulance_bp.route("/register", methods=["POST"])(register_ambulance)

# Ambulance Login
ambulance_bp.route("/login", methods=["POST"])(login_ambulance)

# Logout
ambulance_bp.route("/logout", methods=["POST"])(logout_ambulance)


# Add this to the blueprint
ambulance_bp.route("/inventory", methods=["GET"])(get_ambulance_inventory)


ambulance_bp.route("/location", methods=["POST"])(update_location)



