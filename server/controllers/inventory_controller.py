from models.inventory_model import inventory_collection
from flask import jsonify
from controllers.alerts_controller import create_alert
def add_inventory_item(ambulance_id, item):
    required_fields = ["id", "rfid_id", "name", "code", "type", "quantity"]
    for field in required_fields:
        if field not in item:
            return jsonify({"error": f"{field} is required"}), 400

    if not isinstance(item["quantity"], int) or item["quantity"] < 0:
        return jsonify({"error": "Quantity must be a positive integer"}), 400

    existing_item = inventory_collection.find_one(
        {"ambulance_id": ambulance_id, "items.id": item["id"]},
        {"items.$": 1}
    )

    if existing_item:
        inventory_collection.update_one(
            {"ambulance_id": ambulance_id, "items.id": item["id"]},
            {"$inc": {"items.$.quantity": item["quantity"]}}
        )
        return jsonify({"message": "Item quantity updated successfully"}), 200
    else:
        inventory_collection.update_one(
            {"ambulance_id": ambulance_id},
            {"$push": {"items": item}},
            upsert=True
        )
        return jsonify({"message": "Item added successfully"}), 201

def update_inventory_item(ambulance_id, item_id, updated_item):
    result = inventory_collection.update_one(
        {"ambulance_id": ambulance_id, "items.id": item_id},
        {"$set": {"items.$": updated_item}}
    )
    
    if result.matched_count == 0:
        return jsonify({"error": "Item not found"}), 404
    
    return jsonify({"message": "Item updated successfully"}), 200


def get_inventory(ambulance_id):
    inventory = inventory_collection.find_one({"ambulance_id": ambulance_id}, {"_id": 0})
    
    if not inventory:
        return jsonify({"error": "No inventory found for this ambulance"}), 404
    
    return jsonify(inventory), 200

def delete_inventory_item(ambulance_id, item_id, hospital_id):
    try:
        inventory_doc = inventory_collection.find_one({
            "ambulance_id": ambulance_id,
            "items.id": item_id
        })

        if not inventory_doc:
            return jsonify({"error": "Item not found"}), 404

        for item in inventory_doc['items']:
            if item['id'] == item_id:
                current_quantity = int(item.get('quantity', 0))

                if current_quantity > 1:
                    new_quantity = current_quantity - 1

                    # Manually update quantity
                    inventory_collection.update_one(
                        {"ambulance_id": ambulance_id},
                        {
                            "$set": {
                                "items.$[elem].quantity": str(new_quantity)  # store as string if needed
                            }
                        },
                        array_filters=[{"elem.id": item_id}]
                    )

                    if new_quantity <= 2:
                        create_alert({
                            "ambulance_id": ambulance_id,
                            "patient_id": "N/A",
                            "hospital_id": hospital_id,
                            "alert_type": "Low Inventory",
                            "alert_message": f"Item '{item_id}' is low on stock (quantity: {new_quantity})",
                            "flag": "warning"
                        })

                    return jsonify({"message": "Item quantity reduced by 1"}), 200

                else:
                    inventory_collection.update_one(
                        {"ambulance_id": ambulance_id},
                        {"$pull": {"items": {"id": item_id}}}
                    )
                    return jsonify({"message": "Item quantity was 1, item deleted"}), 200

        return jsonify({"error": "Item not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500
