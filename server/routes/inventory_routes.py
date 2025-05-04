from flask import Blueprint, request
from controllers.inventory_controller import add_inventory_item, update_inventory_item, delete_inventory_item, get_inventory, handle_rfid, handle_weight,add_item

inventory_bp = Blueprint("inventory", __name__)

@inventory_bp.route("/<ambulance_id>/add", methods=["POST"])
def add_item(ambulance_id):
    return add_inventory_item(ambulance_id, request.json)

@inventory_bp.route("/<ambulance_id>/update/<item_id>", methods=["PUT"])
def update_item(ambulance_id, item_id):
    return update_inventory_item(ambulance_id, item_id, request.json)

@inventory_bp.route("/<ambulance_id>/delete/<item_id>/<hospital_id>", methods=["DELETE"])
def delete_item(ambulance_id, item_id, hospital_id):
    return delete_inventory_item(ambulance_id, item_id, hospital_id)

@inventory_bp.route("/<ambulance_id>", methods=["GET"])
def get_items(ambulance_id):
    return get_inventory(ambulance_id)



@inventory_bp.route('/rfid', methods=['POST'])
def receive_rfid():
    return handle_rfid(request)



@inventory_bp.route('/weight', methods=['POST'])
def receive_weight():
    return handle_weight(request)



@inventory_bp.route('/items', methods=['POST'])
def include_item():
    return add_item(request)