from flask import Blueprint
from controllers.alerts_controller import create_alert, get_alerts

alerts_bp = Blueprint("alerts", __name__)

alerts_bp.route("/create", methods=["POST"])(create_alert)
alerts_bp.route("/all", methods=["GET"])(get_alerts)
