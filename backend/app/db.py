# backend/app/db.py
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAME = os.getenv("DB_NAME", "logchain")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

batches_collection = db["batches"]
users_collection = db["users"]
devices_collection = db["devices"]

# Create indexes for better query performance
def create_indexes():
    """Create database indexes for optimal query performance"""
    try:
        # Index for batches: user_id + created_at (for sorting)
        batches_collection.create_index([("user_id", 1), ("created_at", -1)])
        # Index for batches: device_id (for device-specific queries)
        batches_collection.create_index([("device_id", 1)])
        # Index for batches: anchored + created_at (for filtering anchored batches)
        batches_collection.create_index([("anchored", 1), ("created_at", -1)])
        
        # Index for devices: user_id
        devices_collection.create_index([("user_id", 1)])
        # Index for devices: user_id + device_id (for device lookup)
        devices_collection.create_index([("user_id", 1), ("device_id", 1)], unique=True)
        
        # Index for users: email (for login)
        users_collection.create_index([("email", 1)], unique=True)
        print("Database indexes created successfully")
    except Exception as e:
        print(f"Warning: Could not create indexes: {e}")

# Create indexes on module load
create_indexes()