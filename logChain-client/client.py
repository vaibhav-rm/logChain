import os
import time
import uuid
import hashlib
import requests
import json
from datetime import datetime

BACKEND_URL = "http://127.0.0.1:8000"
DEVICE_ID = os.getenv("DEVICE_ID", "devA23")
LOG_DIR = "./logs"
BATCH_INTERVAL = 60  # seconds

def read_logs():
    """Read logs from files in LOG_DIR."""
    logs = []
    for file in os.listdir(LOG_DIR):
        path = os.path.join(LOG_DIR, file)
        if os.path.isfile(path):
            with open(path, "r") as f:
                logs.extend(f.readlines())
    return logs

def compute_merkle_root(logs):
    """Compute a simple Merkle root from log lines."""
    if not logs:
        return None

    hashes = [hashlib.sha256(line.encode()).hexdigest() for line in logs]

    while len(hashes) > 1:
        temp = []
        for i in range(0, len(hashes), 2):
            left = hashes[i]
            right = hashes[i + 1] if i + 1 < len(hashes) else left
            temp.append(hashlib.sha256((left + right).encode()).hexdigest())
        hashes = temp

    return "0x" + hashes[0]

def send_batch(merkle_root, size):
    """Send batch metadata to backend."""
    batch_id = str(uuid.uuid4())[:8]
    payload = {
        "batch_id": batch_id,
        "device_id": DEVICE_ID,
        "merkle_root": merkle_root,
        "ipfs_cid": "bafyfakecid" + batch_id,  # placeholder for now
        "size": size
    }

    try:
        res = requests.post(f"{BACKEND_URL}/batches", json=payload)
        if res.status_code == 200:
            print(f"[{datetime.now()}] ✅ Batch sent:", res.json())
            return res.json().get("id")
        else:
            print(f"[{datetime.now()}] ❌ Failed:", res.text)
    except Exception as e:
        print(f"Error sending batch: {e}")

def main():
    print("🚀 LogChain Client Started")
    while True:
        logs = read_logs()
        if not logs:
            print("No logs found, waiting...")
            time.sleep(BATCH_INTERVAL)
            continue

        merkle_root = compute_merkle_root(logs)
        print(f"Computed Merkle Root: {merkle_root}")

        batch_id = send_batch(merkle_root, len(logs))

        if batch_id:
            print("Anchoring batch...")
            requests.post(f"{BACKEND_URL}/batches/{batch_id}/anchor")

        time.sleep(BATCH_INTERVAL)

if __name__ == "__main__":
    main()
