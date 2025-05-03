from flask import Blueprint
from controllers.request_controller import get_requests_by_hospital, mark_request_received, get_request_by_ambulance, get_patient_allocation

request_routes = Blueprint("request_routes", __name__)

request_routes.route("/requests/hospital/<hospital_id>", methods=["GET"])(get_requests_by_hospital)
request_routes.route("/requests/ambulance", methods=["GET"])(get_request_by_ambulance)
request_routes.route("/requests/patient", methods=["GET"])(get_patient_allocation)
request_routes.route("/requests/mark-received", methods=["POST"])(mark_request_received)
