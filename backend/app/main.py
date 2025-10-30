# backend/app/main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from dotenv import load_dotenv
import os

from app.db import users_collection, devices_collection, batches_collection
from app import schemas
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
        "user_id": ObjectId(current_user)
    }
    result = batches_collection.insert_one(batch_doc)
    batch_doc["_id"] = result.inserted_id
    return serialize_batch(batch_doc)


@app.post("/batches/{batch_id}/anchor", tags=["Batch"])
def anchor_batch(batch_id: str):
    if contract_instance is None:
        raise HTTPException(status_code=500, detail="Contract not configured or deployed")

    batch = batches_collection.find_one({"_id": ObjectId(batch_id)})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
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
def list_batches(current_user=Depends(get_current_user)):
    docs = batches_collection.find({"user_id": ObjectId(current_user)})
    return [serialize_batch(d) for d in docs]

@app.get("/batches/{batch_id}", response_model=schemas.BatchOut, tags=["Batch"])
def get_batch(batch_id: str):
    doc = batches_collection.find_one({"_id": ObjectId(batch_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Batch not found")
    return serialize_batch(doc)


@app.get("/onchain/total", tags=["Batch"])
def onchain_total():
    if contract_instance is None:
        raise HTTPException(status_code=500, detail="Contract not configured")
    total = contract_instance.functions.totalBatches().call()
    return {"total_batches": total}

@app.get("/batches/{batch_id}/verify", tags=["Batch"])
def verify_batch(batch_id: str):
    """Verify whether a batch’s Merkle root exists on-chain"""
    if contract_instance is None:
        raise HTTPException(status_code=500, detail="Contract not configured or deployed")

    batch = batches_collection.find_one({"_id": ObjectId(batch_id)})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

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
    doc = {"user_id": ObjectId(current_user), "device_id": device.device_id, "name": device.name}
    if devices_collection.find_one({"device_id": device.device_id}):
        raise HTTPException(status_code=400, detail="Device ID already exists")
    devices_collection.insert_one(doc)
    users_collection.update_one({"_id": ObjectId(current_user)}, {"$push": {"devices": device.device_id}})
    return {"status": "registered", "device_id": device.device_id}

@app.get("/devices", tags=["Device"])
def list_devices(current_user=Depends(get_current_user)):
    devices = list(devices_collection.find({"user_id": ObjectId(current_user)}))
    return [{"device_id": d["device_id"], "name": d.get("name")} for d in devices]

