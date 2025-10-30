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
batches_collection = db["batches"]