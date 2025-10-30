import os
import time
import uuid
import hashlib
import requests
import json
from datetime import datetime

BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
CLIENT_EMAIL = os.getenv("CLIENT_EMAIL")
CLIENT_PASSWORD = os.getenv("CLIENT_PASSWORD")
DEVICE_ID = os.getenv("DEVICE_ID", "devA23")
DEVICE_NAME = os.getenv("DEVICE_NAME", DEVICE_ID)
LOG_DIR = os.getenv("LOG_DIR", "./logs")
BATCH_INTERVAL = int(os.getenv("BATCH_INTERVAL", "60"))  # seconds

_token = None

def auth_headers():
    global _token
    if not _token:
        _token = obtain_token()
    return {"Authorization": f"Bearer {_token}"} if _token else {}

def obtain_token():
    if not CLIENT_EMAIL or not CLIENT_PASSWORD:
        print("[Auth] CLIENT_EMAIL/CLIENT_PASSWORD not set; running without auth (will fail for protected endpoints)")
        return None
    try:
        data = {"username": CLIENT_EMAIL, "password": CLIENT_PASSWORD}
        res = requests.post(f"{BACKEND_URL}/login", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        if res.ok:
            token = res.json().get("access_token")
            if token:
                print("[Auth] Obtained JWT token")
                return token
        print(f"[Auth] Login failed: {res.status_code} {res.text}")
    except Exception as e:
        print(f"[Auth] Error obtaining token: {e}")
    return None

def ensure_device_registered():
    try:
        # list devices
        res = requests.get(f"{BACKEND_URL}/devices", headers=auth_headers())
        if res.status_code == 401:
            # refresh token once
            global _token
            _token = obtain_token()
            res = requests.get(f"{BACKEND_URL}/devices", headers=auth_headers())
        if res.ok:
            devices = res.json() if isinstance(res.json(), list) else []
            exists = any(d.get("device_id") == DEVICE_ID for d in devices)
            if not exists:
                r = requests.post(
                    f"{BACKEND_URL}/devices",
                    json={"device_id": DEVICE_ID, "name": DEVICE_NAME},
                    headers=auth_headers(),
                )
                if r.ok:
                    print(f"[Device] Registered device '{DEVICE_ID}'")
                else:
                    print(f"[Device] Failed to register device: {r.status_code} {r.text}")
        else:
            print(f"[Device] Failed to list devices: {res.status_code} {res.text}")
    except Exception as e:
        print(f"[Device] Error ensuring device registration: {e}")

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
        res = requests.post(f"{BACKEND_URL}/batches", json=payload, headers=auth_headers())
        if res.status_code == 200:
            print(f"[{datetime.now()}] ✅ Batch sent:", res.json())
            return res.json().get("id")
        else:
            print(f"[{datetime.now()}] ❌ Failed:", res.text)
    except Exception as e:
        print(f"Error sending batch: {e}")

def main():
    print("🚀 LogChain Client Started")
    # Authenticate and ensure device is registered
    obtain_token()
    ensure_device_registered()
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
            try:
                r = requests.post(f"{BACKEND_URL}/batches/{batch_id}/anchor", headers=auth_headers())
                if r.ok:
                    print(f"Anchored: {r.json()}")
                else:
                    print(f"Failed to anchor: {r.status_code} {r.text}")
            except Exception as e:
                print(f"Error anchoring: {e}")

        time.sleep(BATCH_INTERVAL)

if __name__ == "__main__":
    main()
