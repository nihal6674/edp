from config import db

scan_collection = db["scans"]  # Collection to store scan records

# Reference Schema for Scan
scan_schema = {
    "status": str,  # Can be 'refill', 'used', or 'weighted'
    "timestamp": str  # ISO formatted timestamp (e.g., "2025-05-03T14:55:00Z")
}
