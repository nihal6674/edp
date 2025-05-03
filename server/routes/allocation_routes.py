from flask import Blueprint
from controllers.allocation_controller import allocate_ambulance_and_hospital

allocation_bp = Blueprint("allocation", __name__)
allocation_bp.route("/allocate", methods=["POST"])(allocate_ambulance_and_hospital)
