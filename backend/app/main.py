# backend/app/main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from dotenv import load_dotenv
import os

from app.db import users_collection, devices_collection, batches_collection
from app import schemas
from datetime import datetime, timedelta
from app.eth import compile_contract, load_contract_instance, anchor_root
from app.auth import create_access_token, hash_password, verify_password
from app.utils import get_current_user

load_dotenv()

app = FastAPI(title="LogChain API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Contract Setup ===
CONTRACT_PATH = os.path.join(os.path.dirname(__file__), "..", "contracts", "LogAnchor.sol")
CONTRACT_ADDR_FILE = os.getenv("CONTRACT_ADDRESS_FILE", "./deployed_contract_addr.txt")

abi = None
contract_instance = None

def init_contract():
    global abi, contract_instance
    abi_local, bytecode = compile_contract(CONTRACT_PATH)
    abi = abi_local
    if os.path.exists(CONTRACT_ADDR_FILE):
        with open(CONTRACT_ADDR_FILE, "r") as f:
            contract_address = f.read().strip()
        contract_instance = load_contract_instance(abi, contract_address)
    else:
        contract_instance = None

init_contract()

# === Utility ===
def serialize_batch(doc):
    """Convert MongoDB document to serializable dict"""
    created_at = doc.get("created_at")
    # Convert datetime to ISO format string if it's a datetime object
    if created_at and isinstance(created_at, datetime):
        created_at = created_at.isoformat() + "Z"  # Add Z to indicate UTC
    # Only include fields that are needed to reduce payload size
    return {
        "id": str(doc["_id"]),
        "batch_id": doc.get("batch_id"),
        "device_id": doc.get("device_id"),
        "merkle_root": doc.get("merkle_root"),
        "ipfs_cid": doc.get("ipfs_cid"),
        "size": doc.get("size"),
        "anchored": doc.get("anchored", 0),
        "tx_hash": doc.get("tx_hash"),
        "tx_block": doc.get("tx_block"),
        "created_at": created_at,
    }

# === Routes ===

@app.post("/batches", response_model=schemas.BatchOut, tags=["Batch"])
def create_batch(b: schemas.BatchCreate, current_user=Depends(get_current_user)):
    if not b.merkle_root.startswith("0x") or len(b.merkle_root) != 66:
        raise HTTPException(status_code=400, detail="Invalid merkle_root format")

    batch_doc = {
        "batch_id": b.batch_id,
        "device_id": b.device_id,
        "merkle_root": b.merkle_root,
        "ipfs_cid": b.ipfs_cid,
        "size": b.size,
        "anchored": 0,
        "user_id": ObjectId(current_user),
        "created_at": datetime.utcnow(),
    }
    result = batches_collection.insert_one(batch_doc)
    batch_doc["_id"] = result.inserted_id
    return serialize_batch(batch_doc)


@app.post("/batches/{batch_id}/anchor", tags=["Batch"])
def anchor_batch(batch_id: str, current_user=Depends(get_current_user)):
    if contract_instance is None:
        raise HTTPException(status_code=500, detail="Contract not configured or deployed")

    batch = batches_collection.find_one({"_id": ObjectId(batch_id)})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    # Verify batch belongs to current user
    if batch.get("user_id") != ObjectId(current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    if batch.get("anchored") == 1:
        return {"status": "already anchored", "tx_hash": batch.get("tx_hash")}

    try:
        tx_hash, receipt = anchor_root(contract_instance, batch["merkle_root"], batch.get("batch_id") or "", batch.get("ipfs_cid") or "")
        batches_collection.update_one(
            {"_id": ObjectId(batch_id)},
            {"$set": {"anchored": 1, "tx_hash": tx_hash, "tx_block": receipt.blockNumber}}
        )
        return {"status": "anchored", "tx_hash": tx_hash, "blockNumber": receipt.blockNumber}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/batches", response_model=list[schemas.BatchOut], tags=["Batch"])
def list_batches(current_user=Depends(get_current_user), limit: int = 1000):
    # Limit results to prevent large payloads, sort by created_at descending
    docs = batches_collection.find({"user_id": ObjectId(current_user)}).sort("created_at", -1).limit(limit)
    return [serialize_batch(d) for d in docs]

@app.get("/dashboard/stats", tags=["Dashboard"])
def dashboard_stats(current_user=Depends(get_current_user)):
    """Optimized endpoint for dashboard - returns aggregated stats and recent batches only"""
    user_id = ObjectId(current_user)
    
    # Use aggregation pipeline to get all batch stats in ONE query (much faster)
    batch_stats = list(batches_collection.aggregate([
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": None,
            "totalBatches": {"$sum": 1},
            "anchoredBatches": {"$sum": {"$cond": [{"$eq": ["$anchored", 1]}, 1, 0]}},
        }}
    ]))
    
    if batch_stats:
        stats_result = batch_stats[0]
        total_batches = stats_result.get("totalBatches", 0)
        anchored_batches = stats_result.get("anchoredBatches", 0)
        pending_batches = total_batches - anchored_batches
    else:
        total_batches = 0
        anchored_batches = 0
        pending_batches = 0
    
    # Get total devices count (indexed query)
    total_devices = devices_collection.count_documents({"user_id": user_id})
    
    # Get online devices count (last_seen within 6 minutes) - use indexed query
    six_min_ago = datetime.utcnow() - timedelta(minutes=6)
    online_devices = devices_collection.count_documents({
        "user_id": user_id,
        "last_seen": {"$gte": six_min_ago}
    })
    
    # Get most recent anchored batch and recent batches in parallel
    # Use find_one with index for fast lookup
    last_anchored_batch = batches_collection.find_one(
        {"user_id": user_id, "anchored": 1, "tx_hash": {"$ne": None}},
        sort=[("created_at", -1)],
        projection={"batch_id": 1, "created_at": 1, "_id": 0}
    )
    
    # Get only recent batches for activity feed (last 10) - already indexed
    recent_batches = batches_collection.find(
        {"user_id": user_id},
        sort=[("created_at", -1)],
        limit=10,
        projection={"batch_id": 1, "device_id": 1, "merkle_root": 1, "anchored": 1, "tx_hash": 1, "created_at": 1, "size": 1, "ipfs_cid": 1, "_id": 1}
    )
    
    recent_batches_list = []
    for batch in recent_batches:
        batch_data = serialize_batch(batch)
        recent_batches_list.append(batch_data)
    
    return {
        "stats": {
            "totalBatches": total_batches,
            "anchoredBatches": anchored_batches,
            "pendingBatches": pending_batches,
            "totalDevices": total_devices,
            "onlineDevices": online_devices,
        },
        "lastAnchored": {
            "batch_id": last_anchored_batch.get("batch_id") if last_anchored_batch else None,
            "created_at": last_anchored_batch.get("created_at").isoformat() + "Z" if last_anchored_batch and isinstance(last_anchored_batch.get("created_at"), datetime) else None,
        } if last_anchored_batch else None,
        "recentBatches": recent_batches_list,
    }

@app.get("/batches/{batch_id}", response_model=schemas.BatchOut, tags=["Batch"])
def get_batch(batch_id: str, current_user=Depends(get_current_user)):
    doc = batches_collection.find_one({"_id": ObjectId(batch_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Batch not found")
    # Verify batch belongs to current user
    if doc.get("user_id") != ObjectId(current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    return serialize_batch(doc)


@app.get("/onchain/total", tags=["Batch"])
def onchain_total():
    """Get on-chain total - may be slow, use timeout in frontend"""
    if contract_instance is None:
        return {"total_batches": 0}  # Don't error, just return 0
    try:
        # Add timeout to blockchain call (if using web3.py timeout)
        total = contract_instance.functions.totalBatches().call()
        return {"total_batches": total}
    except Exception as e:
        # Don't fail if blockchain is slow/unavailable
        print(f"Warning: Failed to get onchain total: {e}")
        return {"total_batches": 0}

@app.get("/batches/{batch_id}/verify", tags=["Batch"])
def verify_batch(batch_id: str, current_user=Depends(get_current_user)):
    """Verify whether a batch's Merkle root exists on-chain"""
    if contract_instance is None:
        raise HTTPException(status_code=500, detail="Contract not configured or deployed")

    batch = batches_collection.find_one({"_id": ObjectId(batch_id)})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    # Verify batch belongs to current user
    if batch.get("user_id") != ObjectId(current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    root_hex = batch.get("merkle_root")
    if not root_hex:
        raise HTTPException(status_code=400, detail="Batch missing merkle_root")

    try:
        total = contract_instance.functions.totalBatches().call()
        anchored_onchain = False
        found_index = None

        # normalize: remove 0x, lowercase for comparison
        normalized_root = root_hex.lower().replace("0x", "")

        for i in range(total):
            onchain_root, owner, ts, batchId, ipfsCid = contract_instance.functions.getBatch(i).call()

            # convert bytes32 → 0x-prefixed hex string
            onchain_hex = "0x" + onchain_root.hex().lower()

            if onchain_hex == root_hex.lower():
                anchored_onchain = True
                found_index = i
                break

        return {
            "batch_id": batch.get("batch_id"),
            "merkle_root": root_hex,
            "anchored_onchain": anchored_onchain,
            "db_anchored_flag": batch.get("anchored", 0),
            "tx_hash": batch.get("tx_hash"),
            "tx_block": batch.get("tx_block"),
            "found_index": found_index
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === AUTH ROUTES ===

@app.post("/signup", tags=["Auth"])
def signup(user: schemas.UserCreate):
    existing = users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(user.password) < 4:
        raise HTTPException(status_code=400, detail="Password too short")

    hashed_pw = hash_password(user.password)
    user_doc = {"email": user.email, "password": hashed_pw, "devices": []}
    result = users_collection.insert_one(user_doc)

    token = create_access_token({"sub": str(result.inserted_id)})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/login", tags=["Auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"email": form_data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": token, "token_type": "bearer"}

# === DEVICE ROUTES ===

@app.post("/devices", tags=["Device"])
def register_device(device: schemas.DeviceCreate, current_user=Depends(get_current_user)):
    # Check if device already exists for this user
    existing = devices_collection.find_one({"user_id": ObjectId(current_user), "device_id": device.device_id})
    if existing:
        raise HTTPException(status_code=400, detail="Device ID already registered for your account")
    doc = {"user_id": ObjectId(current_user), "device_id": device.device_id, "name": device.name, "created_at": datetime.utcnow()}
    devices_collection.insert_one(doc)
    users_collection.update_one({"_id": ObjectId(current_user)}, {"$push": {"devices": device.device_id}})
    return {"status": "registered", "device_id": device.device_id}

@app.get("/devices", tags=["Device"])
def list_devices(current_user=Depends(get_current_user), include_batch_info: bool = False):
    # Use projection to only fetch needed fields for better performance
    devices = list(devices_collection.find(
        {"user_id": ObjectId(current_user)},
        {"device_id": 1, "name": 1, "platform": 1, "version": 1, "last_seen": 1, "storage_bytes": 1}
    ))
    result = []
    for d in devices:
        last_seen = d.get("last_seen")
        # Convert datetime to ISO format string if it's a datetime object
        if last_seen and isinstance(last_seen, datetime):
            last_seen = last_seen.isoformat() + "Z"  # Add Z to indicate UTC
        
        device_result = {
            "device_id": d.get("device_id"),
            "name": d.get("name"),
            "platform": d.get("platform"),
            "version": d.get("version"),
            "last_seen": last_seen,
            "storage_bytes": d.get("storage_bytes"),
        }
        
        # Optionally include last batch info (for devices page optimization)
        if include_batch_info:
            # Get the most recent anchored batch for this device (optimized query)
            last_batch = batches_collection.find_one(
                {"user_id": ObjectId(current_user), "device_id": d.get("device_id"), "anchored": 1},
                sort=[("created_at", -1)],
                projection={"batch_id": 1, "merkle_root": 1, "created_at": 1, "size": 1}
            )
            if last_batch:
                device_result["last_anchor"] = {
                    "batch_id": last_batch.get("batch_id"),
                    "merkle_root": last_batch.get("merkle_root"),
                    "created_at": last_batch.get("created_at").isoformat() + "Z" if isinstance(last_batch.get("created_at"), datetime) else last_batch.get("created_at"),
                }
            
            # Get total logs count for this device (aggregate query)
            total_logs = batches_collection.aggregate([
                {"$match": {"user_id": ObjectId(current_user), "device_id": d.get("device_id")}},
                {"$group": {"_id": None, "total": {"$sum": "$size"}}}
            ])
            total_logs_list = list(total_logs)
            device_result["total_logs"] = total_logs_list[0]["total"] if total_logs_list else 0
        
        result.append(device_result)
    return result

@app.post("/devices/heartbeat", tags=["Device"])
def device_heartbeat(hb: schemas.DeviceHeartbeat, current_user=Depends(get_current_user)):
    # Verify device belongs to current user
    device = devices_collection.find_one({"user_id": ObjectId(current_user), "device_id": hb.device_id})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found or access denied")
    
    update = {
        "platform": hb.platform,
        "version": hb.version,
        "storage_bytes": hb.storage_bytes,
        "last_seen": datetime.utcnow(),
    }
    devices_collection.update_one(
        {"user_id": ObjectId(current_user), "device_id": hb.device_id},
        {"$set": update},
        upsert=False,
    )
    return {"status": "ok", "device_id": hb.device_id}

@app.delete("/devices/{device_id}", tags=["Device"])
def delete_device(device_id: str, current_user=Depends(get_current_user)):
    # Verify device belongs to current user
    device = devices_collection.find_one({"user_id": ObjectId(current_user), "device_id": device_id})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found or access denied")
    
    # Remove device from devices collection
    devices_collection.delete_one({"user_id": ObjectId(current_user), "device_id": device_id})
    
    # Remove device_id from user's devices list
    users_collection.update_one(
        {"_id": ObjectId(current_user)},
        {"$pull": {"devices": device_id}}
    )
    
    return {"status": "deleted", "device_id": device_id}

