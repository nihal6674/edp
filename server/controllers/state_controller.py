from config import db  # or however you import your db instance

def set_state(key, value):
    db.state.update_one(
        {"key": key},
        {"$set": {"value": value}},
        upsert=True
    )

def get_state(key, default=None):
    doc = db.state.find_one({"key": key})
    return doc["value"] if doc else default
