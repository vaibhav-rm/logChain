# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from dotenv import load_dotenv
import os

from app.db import batches_collection
from app import schemas
from app.eth import compile_contract, load_contract_instance, anchor_root

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

@app.post("/batches", response_model=schemas.BatchOut)
def create_batch(b: schemas.BatchCreate):
    if not b.merkle_root.startswith("0x") or len(b.merkle_root) != 66:
        raise HTTPException(status_code=400, detail="Invalid merkle_root format")

    batch_doc = {
        "batch_id": b.batch_id,
        "device_id": b.device_id,
        "merkle_root": b.merkle_root,
        "ipfs_cid": b.ipfs_cid,
        "size": b.size,
        "anchored": 0
    }
    result = batches_collection.insert_one(batch_doc)
    batch_doc["_id"] = result.inserted_id
    return serialize_batch(batch_doc)


@app.post("/batches/{batch_id}/anchor")
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


@app.get("/batches", response_model=list[schemas.BatchOut])
def list_batches(skip: int = 0, limit: int = 50):
    docs = batches_collection.find().sort("_id", -1).skip(skip).limit(limit)
    return [serialize_batch(d) for d in docs]


@app.get("/batches/{batch_id}", response_model=schemas.BatchOut)
def get_batch(batch_id: str):
    doc = batches_collection.find_one({"_id": ObjectId(batch_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Batch not found")
    return serialize_batch(doc)


@app.get("/onchain/total")
def onchain_total():
    if contract_instance is None:
        raise HTTPException(status_code=500, detail="Contract not configured")
    total = contract_instance.functions.totalBatches().call()
    return {"total_batches": total}
