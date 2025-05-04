from flask import Blueprint
from controllers.scan_controller import change_mode

scan_bp = Blueprint("scan_bp", __name__)

scan_bp.route("/modechange", methods=["POST"])(change_mode)
