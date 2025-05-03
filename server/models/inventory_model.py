from config import db

inventory_collection = db["inventory"]  # Collection for ambulance inventory

# Reference Schema for Inventory
inventory_schema = {
    "ambulance_id": str,  # ID of the ambulance (A001, A002, etc.)
    "items": [
        {
            "id": str,         # Unique Item ID
            "rfid_id": str,    # RFID tag of the item
            "name": str,       # Name of the item
            "code": str,       # critical / non-critical
            "type": str,       # tablet / syrup / equipment / etc.
            "quantity": int    # Quantity of the item
        }
    ]
}
