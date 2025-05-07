from datetime import datetime
from flask import Flask, request, jsonify
from models.inventory_model import inventory_collection
from controllers.alerts_controller import create_alert
from models.item_model import Item
from models.scan_model import scan_collection
from config import db
from bson import ObjectId

from controllers.state_controller import get_state, set_state

last2 = get_state("last2", default=300)
 
latest_weight = None
last_weight = 0

last3=275


def add_inventory_item(ambulance_id, item):
    required_fields = ["id", "rfid_id", "name", "code", "type", "quantity"]
    for field in required_fields:
        if field not in item:
            return jsonify({"error": f"{field} is required"}), 400

    try:
        item["quantity"] = int(item["quantity"])
    except (ValueError, TypeError):
        return jsonify({"error": "Quantity must be a positive integer"}), 400

    if item["quantity"] < 0:
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
    if 'quantity' in updated_item:
        try:
            updated_item['quantity'] = int(updated_item['quantity'])
        except (ValueError, TypeError):
            return jsonify({"error": "Quantity must be an integer"}), 400

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
                try:
                    current_quantity = int(item.get('quantity', 0))
                except (ValueError, TypeError):
                    current_quantity = 0

                if current_quantity > 1:
                    new_quantity = current_quantity - 1

                    inventory_collection.update_one(
                        {"ambulance_id": ambulance_id},
                        {
                            "$set": {
                                "items.$[elem].quantity": new_quantity
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
    
def get_latest_rfid_summary():
    try:
        latest_rfid = db.rfid_summary.find({"ambulance_id": "A001"}).sort("timestamp", -1).limit(1)

        if latest_rfid.alive is False:
            print("No RFID summary found.")
            return jsonify({"error": "No RFID summary found for ambulance A001"}), 404

        latest_rfid_summary = list(latest_rfid)[0]
        latest_rfid_summary["_id"] = str(latest_rfid_summary["_id"])

        print("latest rfid summary: ", latest_rfid_summary)
        return jsonify(latest_rfid_summary), 200
    except Exception as e:
        print(f"Error in getting RFID summary: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


def handle_rfid(request):
    global latest_weight
    global last_weight
    data = request.get_json()
    rfid_id = data.get('uid')

    if not rfid_id:
        return jsonify({"error": "No RFID received"}), 400

    rfid_id = rfid_id.strip().upper()
    print(f"📡 Received Tag UID: {rfid_id}")

    items_collection = db.items
    item = items_collection.find_one({"rfid_id": rfid_id})
    inventory_doc = inventory_collection.find_one({
        "ambulance_id": "A001",
        "items.rfid_id": item["rfid_id"]
    })

    matched_item = None
    if inventory_doc and "items" in inventory_doc:
        matched_item = next((i for i in inventory_doc["items"] if i["rfid_id"] == item["rfid_id"]), None)

    if item:
        scan_document = scan_collection.find_one()
        if scan_document:
            status = scan_document.get('status')
            print("Current Status:", status)

            if status == 'refill':
                add_inventory_item("A001", {
                    "id": item['id'],
                    "rfid_id": item['rfid_id'],
                    "name": item['name'],
                    "code": item['code'],
                    "type": item['type'],
                    "quantity": 1
                })
                rfid_summary = {
                    "ambulance_id": "A001",
                    "item_name": item["name"],
                    "quantity": matched_item["quantity"],
                    "mode": "refill",
                    "timestamp": datetime.utcnow()
                }
                db.rfid_summary.insert_one(rfid_summary)
                print(f"Item {item['name']} added to inventory (refill).")

            elif status == 'used':
                delete_inventory_item("A001", item['id'], "H004")
                rfid_summary = {
                    "ambulance_id": "A001",
                    "item_name": item["name"],
                    "quantity": matched_item["quantity"],
                    "mode": "used",
                    "timestamp": datetime.utcnow()
                }
                
                db.rfid_summary.insert_one(rfid_summary)
                print(f"Item {item['name']} removed from inventory (used).")

            elif status == 'weighted':
                if latest_weight is None:
                    return jsonify({"error": "No weight data available"}), 400

                if latest_weight < 0:
                    latest_weight = 0

                last2 = get_state("last2", default=300)
                print("🔍 last2 value:", last2)

                difference = last2 - latest_weight

                # Fetch the item entry from the inventory
                doc = inventory_collection.find_one({
                    "ambulance_id": "A001",
                    "items.id": item["id"]
                })

                if not doc:
                    return jsonify({"error": "Item not found in inventory"}), 404

                # Locate the item inside the items array
                matched_item = next((i for i in doc["items"] if i["id"] == item["id"]), None)
                matched_item_id = matched_item["id"] if matched_item else None

                if not matched_item:
                    return jsonify({"error": "Item not found in items list"}), 404

                current_quantity = matched_item.get("quantity", 0)

                # Compute new quantity
                new_quantity = current_quantity - difference
                if new_quantity <= 0:
                    # Set to zero explicitly
                    new_quantity = 0
                    update_result = inventory_collection.update_one(
                        {"ambulance_id": "A001", "items.id": item["id"]},
                        {"$set": {"items.$.quantity": 0}}
                    )

                    create_alert({
                        "ambulance_id": "A001",
                        "patient_id": "N/A",
                        "hospital_id": "H004",
                        "alert_type": "Low Inventory",
                        "alert_message": f"Item '{matched_item_id}' is low on stock (quantity: {new_quantity})",
                        "flag": "warning"
                    })
                else:
                    # Subtract the difference
                    update_result = inventory_collection.update_one(
                        {"ambulance_id": "A001", "items.id": item["id"]},
                        {"$inc": {"items.$.quantity": -difference}}
                    )

                if update_result.modified_count > 0:
                    rfid_summary = {
                        "ambulance_id": "A001",
                        "item_name": item["name"],
                        "quantity": new_quantity,
                        "mode": "weighted",
                        "timestamp": datetime.utcnow()
                    }
                    db.rfid_summary.insert_one(rfid_summary)
                    print(f"✅ Updated item quantity for {item['name']} by -{difference}")
                else:
                    print("⚠️ Item quantity update failed or already up to date.")
                difference=0
                set_state("last2", latest_weight)
                print("📦 Weight from load cell:", latest_weight)
                print("📏 Weight difference:", difference)
                print(f"Item {item['name']} is weighted.")

            elif status == "weighted_refill":
                if latest_weight >= 10 and last_weight is not None:
                    quant = latest_weight - last3

                    doc = inventory_collection.find_one({
                        "ambulance_id": "A001",
                        "items.id": item["id"]
                    })

                    if not doc:
                        return jsonify({"error": "Item not found in inventory"}), 404

                    # Locate the item inside the items array
                    matched_item = next((i for i in doc["items"] if i["id"] == item["id"]), None)

                    if not matched_item:
                        return jsonify({"error": "Item not found in items list"}), 404

                    # Perform the update
                    update_result = inventory_collection.update_one(
                        {"ambulance_id": "A001", "items.id": item["id"]},
                        {"$inc": {"items.$.quantity": quant}}
                    )
                    if quant < 30:
                        create_alert({
                            "ambulance_id": "A001",
                            "patient_id": "N/A",
                            "hospital_id": "H004",
                            "alert_type": "Low Inventory",
                            "alert_message": f"Item '{matched_item_id}' is low on stock (quantity: {new_quantity})",
                            "flag": "warning"
                        })
                    if update_result.modified_count > 0:
                        rfid_summary = {
                            "ambulance_id": "A001",
                            "item_name": item["name"],
                            "quantity": quant,
                            "mode": "weighted_refill",
                            "timestamp": datetime.utcnow()
                        }
                        db.rfid_summary.insert_one(rfid_summary)
                        print(f"✅ Updated item quantity for {item['name']} by +{quant}")
                        return jsonify({
                            "message": "Quantity updated via weighted refill",
                            "added_quantity": quant,
                            "item": item["name"]
                        }), 200
                    else:
                        print("⚠️ Item quantity update failed or unchanged.")
                        return jsonify({"message": "No update made"}), 200
                    last3=latest_weight

                else:
                    return jsonify({"message": "Tray is empty or last_weight missing"}), 200


        item['_id'] = str(item['_id'])

        return jsonify({
            "message": "RFID UID received",
            "RFID": rfid_id,
            "item": item,
            "weight": latest_weight if status == 'weighted' else None,
            "difference": difference if status == 'weighted' else None
        }), 200

    else:
        return jsonify({
            "message": "Unknown RFID UID",
            "RFID": rfid_id
        }), 404

def handle_weight(request):
    global latest_weight
    data = request.get_json()
    weight = data.get("weight")

    if weight is None:
        return jsonify({"error": "No weight provided"}), 400

    latest_weight = weight  # Store the received weight
    print(f"✅ Updated latest weight: {latest_weight}")

    difference = 500 - weight
    return jsonify({
        "difference": difference,
        "weight": weight
    }), 200



def add_item(request):
    data = request.get_json()
    required_fields = ['id', 'rfid_id', 'name', 'code', 'type']

    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    item_data = {
        "id": data['id'],
        "rfid_id": data['rfid_id'],
        "name": data['name'],
        "code": data['code'],
        "type": data['type']
    }

    try:
        result = db.items.insert_one(item_data)
        return jsonify({
            "message": "Item added successfully!",
            "item_id": str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


