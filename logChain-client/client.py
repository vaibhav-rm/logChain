import os
import time
import uuid
import hashlib
import requests
import json
import threading
import queue
from datetime import datetime
import platform as py_platform
import shutil

tk = None
HAS_TTKBOOTSTRAP = False
try:
    import ttkbootstrap as ttk
    from ttkbootstrap.constants import *
    from ttkbootstrap.dialogs import Messagebox
    HAS_TTKBOOTSTRAP = True
    # Also import tkinter for compatibility
    try:
        import tkinter as tk
        from tkinter import filedialog, messagebox
    except:
        pass
except ImportError:
    try:
        import tkinter as tk
        from tkinter import ttk, filedialog, messagebox
        HAS_TTKBOOTSTRAP = False
    except Exception:
        tk = None
        HAS_TTKBOOTSTRAP = False

# Load config from file if exists
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
CLIENT_EMAIL = os.getenv("CLIENT_EMAIL")
CLIENT_PASSWORD = os.getenv("CLIENT_PASSWORD")
DEVICE_ID = os.getenv("DEVICE_ID", "devA23")
DEVICE_NAME = os.getenv("DEVICE_NAME", DEVICE_ID)
LOG_DIR = os.getenv("LOG_DIR") or ("/var/log" if os.path.isdir("/var/log") else "./logs")
BATCH_INTERVAL = int(os.getenv("BATCH_INTERVAL", "60"))  # seconds

# Load config file if it exists
try:
    if os.path.exists("client_config.json"):
        with open("client_config.json", "r") as f:
            cfg = json.load(f)
            BACKEND_URL = cfg.get("BACKEND_URL", BACKEND_URL)
            CLIENT_EMAIL = cfg.get("CLIENT_EMAIL", CLIENT_EMAIL)
            CLIENT_PASSWORD = cfg.get("CLIENT_PASSWORD", CLIENT_PASSWORD)  # Load password from config
            DEVICE_ID = cfg.get("DEVICE_ID", DEVICE_ID)
            DEVICE_NAME = cfg.get("DEVICE_NAME", DEVICE_NAME)
            LOG_DIR = cfg.get("LOG_DIR", LOG_DIR)
            BATCH_INTERVAL = cfg.get("BATCH_INTERVAL", BATCH_INTERVAL)
except Exception:
    pass

_token = None
_stop_event = threading.Event()
_ui_queue = queue.Queue()

def auth_headers():
    global _token
    if not _token:
        _token = obtain_token()
    return {"Authorization": f"Bearer {_token}"} if _token else {}

def obtain_token():
    if not CLIENT_EMAIL or not CLIENT_PASSWORD:
        log_ui("[Auth] CLIENT_EMAIL/CLIENT_PASSWORD not set; cannot authenticate.")
        return None
    try:
        data = {"username": CLIENT_EMAIL, "password": CLIENT_PASSWORD}
        res = requests.post(f"{BACKEND_URL}/login", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        if res.ok:
            token = res.json().get("access_token")
            if token:
                log_ui("[Auth] Obtained JWT token")
                return token
        log_ui(f"[Auth] Login failed: {res.status_code} {res.text}")
    except Exception as e:
        log_ui(f"[Auth] Error obtaining token: {e}")
    return None

def ensure_device_registered():
    try:
        headers = auth_headers()
        if not headers.get("Authorization"):
            log_ui("[Device] No auth token, cannot register device")
            return False
        # list devices
        res = requests.get(f"{BACKEND_URL}/devices", headers=headers)
        if res.status_code == 401:
            # refresh token once
            global _token
            _token = obtain_token()
            headers = auth_headers()
            if not headers.get("Authorization"):
                log_ui("[Device] Failed to refresh token")
                return False
            res = requests.get(f"{BACKEND_URL}/devices", headers=headers)
        if res.ok:
            devices = res.json() if isinstance(res.json(), list) else []
            exists = any(d.get("device_id") == DEVICE_ID for d in devices)
            if not exists:
                log_ui(f"[Device] Device '{DEVICE_ID}' not found, registering...")
                r = requests.post(
                    f"{BACKEND_URL}/devices",
                    json={"device_id": DEVICE_ID, "name": DEVICE_NAME},
                    headers=headers,
                )
                if r.ok:
                    log_ui(f"[Device] ✅ Registered device '{DEVICE_ID}' successfully")
                    return True
                else:
                    log_ui(f"[Device] ❌ Failed to register device: {r.status_code} {r.text}")
                    return False
            else:
                log_ui(f"[Device] ✅ Device '{DEVICE_ID}' already registered")
                return True
        else:
            log_ui(f"[Device] ❌ Failed to list devices: {res.status_code} {res.text}")
            return False
    except Exception as e:
        log_ui(f"[Device] ❌ Error ensuring device registration: {e}")
        return False

def send_heartbeat():
    try:
        info = {
            "device_id": DEVICE_ID,
            "platform": f"{py_platform.system()} {py_platform.release()}",
            "version": "v1.0.0",
            "storage_bytes": shutil.disk_usage(LOG_DIR if os.path.isdir(LOG_DIR) else ".").used,
        }
        headers = auth_headers()
        if not headers.get("Authorization"):
            log_ui("[Heartbeat] No auth token available, skipping heartbeat")
            return
        r = requests.post(f"{BACKEND_URL}/devices/heartbeat", json=info, headers=headers)
        if r.ok:
            log_ui(f"[Heartbeat] ✅ Sent successfully")
        else:
            log_ui(f"[Heartbeat] ❌ Failed: {r.status_code} {r.text}")
            # Try to refresh token on 401
            if r.status_code == 401:
                global _token
                _token = None
                headers = auth_headers()
                r2 = requests.post(f"{BACKEND_URL}/devices/heartbeat", json=info, headers=headers)
                if r2.ok:
                    log_ui(f"[Heartbeat] ✅ Sent successfully (after token refresh)")
                else:
                    log_ui(f"[Heartbeat] ❌ Failed after refresh: {r2.status_code} {r2.text}")
    except Exception as e:
        log_ui(f"[Heartbeat] ❌ Error: {e}")

def read_logs():
    """Read logs from files in LOG_DIR."""
    logs = []
    if not os.path.exists(LOG_DIR):
        log_ui(f"[Logs] Directory not found: {LOG_DIR}")
        return logs
    if not os.path.isdir(LOG_DIR):
        log_ui(f"[Logs] Path is not a directory: {LOG_DIR}")
        return logs
    try:
        for file in os.listdir(LOG_DIR):
            path = os.path.join(LOG_DIR, file)
            if os.path.isfile(path):
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        logs.extend(f.readlines())
                except PermissionError:
                    log_ui(f"[Logs] Permission denied: {path}")
                except Exception as e:
                    log_ui(f"[Logs] Error reading {path}: {e}")
    except PermissionError:
        log_ui(f"[Logs] Permission denied accessing directory: {LOG_DIR}")
    except Exception as e:
        log_ui(f"[Logs] Error listing directory: {e}")
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
        headers = auth_headers()
        if not headers.get("Authorization"):
            log_ui(f"[Batch] ❌ No auth token available, cannot send batch")
            return None
        log_ui(f"[Batch] Sending batch {batch_id} to {BACKEND_URL}/batches...")
        res = requests.post(f"{BACKEND_URL}/batches", json=payload, headers=headers, timeout=10)
        if res.status_code == 200:
            response_data = res.json()
            log_ui(f"[{datetime.now()}] ✅ Batch sent successfully: ID={response_data.get('id', 'unknown')}")
            return response_data.get("id")
        elif res.status_code == 401:
            # Token expired, try to refresh
            log_ui("[Batch] Token expired, refreshing...")
            global _token
            _token = None
            headers = auth_headers()
            if not headers.get("Authorization"):
                log_ui("[Batch] ❌ Failed to refresh token")
                return None
            res = requests.post(f"{BACKEND_URL}/batches", json=payload, headers=headers, timeout=10)
            if res.status_code == 200:
                response_data = res.json()
                log_ui(f"[{datetime.now()}] ✅ Batch sent (after token refresh): ID={response_data.get('id', 'unknown')}")
                return response_data.get("id")
            else:
                log_ui(f"[{datetime.now()}] ❌ Failed after token refresh: {res.status_code} {res.text}")
        else:
            log_ui(f"[{datetime.now()}] ❌ Failed: {res.status_code} {res.text}")
    except requests.exceptions.Timeout:
        log_ui(f"[Batch] ❌ Request timeout connecting to {BACKEND_URL}")
    except requests.exceptions.ConnectionError:
        log_ui(f"[Batch] ❌ Connection error: Cannot reach {BACKEND_URL}. Is the backend running?")
    except Exception as e:
        log_ui(f"[Batch] ❌ Error sending batch: {e}")
    return None

def log_ui(message: str):
    print(message)
    try:
        _ui_queue.put_nowait(message)
    except Exception:
        pass

def run_agent_loop():
    if not obtain_token():
        log_ui("[System] Authentication failed. Please check your email and password in Settings.")
        return
    
    if not ensure_device_registered():
        log_ui("[System] Device registration failed, but continuing...")
    
    # Send initial heartbeat immediately
    send_heartbeat()
    log_ui(f"[System] Starting main loop (Batch Interval: {BATCH_INTERVAL}s, Log Dir: {LOG_DIR})")
    
    # Start heartbeat thread - send every 30 seconds
    def heartbeat_thread():
        while not _stop_event.is_set():
            if _stop_event.wait(30):  # Wait 30 seconds or until stop event
                break
            send_heartbeat()
    
    threading.Thread(target=heartbeat_thread, daemon=True).start()
    log_ui("[System] Heartbeat thread started")
    
    while not _stop_event.is_set():
        try:
            logs = read_logs()
            log_ui(f"[Logs] Read {len(logs)} log lines from {LOG_DIR}")
            if not logs:
                log_ui(f"[Logs] No logs found in {LOG_DIR}, waiting {BATCH_INTERVAL}s...")
                if _stop_event.wait(BATCH_INTERVAL):
                    break
                continue
            
            merkle_root = compute_merkle_root(logs)
            if merkle_root:
                log_ui(f"Computed Merkle Root: {merkle_root}")
                batch_id = send_batch(merkle_root, len(logs))
                if batch_id:
                    try:
                        r = requests.post(f"{BACKEND_URL}/batches/{batch_id}/anchor", headers=auth_headers())
                        if r.ok:
                            log_ui(f"Anchored: {r.json()}")
                        else:
                            log_ui(f"Failed to anchor: {r.status_code} {r.text}")
                    except Exception as e:
                        log_ui(f"Error anchoring: {e}")
            
            # Wait for next interval
            if _stop_event.wait(BATCH_INTERVAL):
                break
        except Exception as e:
            log_ui(f"[Loop] Error: {e}")
            if _stop_event.wait(BATCH_INTERVAL):
                break

class LogChainGUI:
    def __init__(self):
        if HAS_TTKBOOTSTRAP:
            self.app = ttk.Window(
                title="LogChain Client",
                themename="superhero",
                size=(880, 640),
                resizable=(True, True),
            )
        else:
            self.app = tk.Tk()
            self.app.title("LogChain Client")
            self.app.geometry("880x640")

        self.status_var = tk.StringVar()
        self.status_var.set("Idle")
        self.running = False

        notebook = ttk.Notebook(self.app)
        self.tab_settings = ttk.Frame(notebook, padding=10)
        self.tab_logs = ttk.Frame(notebook, padding=10)
        notebook.add(self.tab_settings, text="⚙ Settings")
        notebook.add(self.tab_logs, text="📜 Logs")
        notebook.pack(fill="both", expand=True)

        self._build_settings_tab()
        self._build_logs_tab()

        self.app.after(300, self.drain_queue)
        self.app.protocol("WM_DELETE_WINDOW", self.on_close)

    def _build_settings_tab(self):
        if HAS_TTKBOOTSTRAP:
            cfg = ttk.Labelframe(self.tab_settings, text="Configuration", padding=10)
        else:
            cfg = ttk.LabelFrame(self.tab_settings, text="Configuration", padding=10)
        cfg.pack(fill="x", pady=10)

        # StringVar and IntVar are always from tkinter (tk), not from ttk
        var_type = tk.StringVar
        int_type = tk.IntVar

        self.backend_var = var_type(value=BACKEND_URL)
        self.email_var = var_type(value=CLIENT_EMAIL or "")
        self.password_var = var_type(value=CLIENT_PASSWORD or "")
        self.device_id_var = var_type(value=DEVICE_ID)
        self.device_name_var = var_type(value=DEVICE_NAME)
        self.log_dir_var = var_type(value=LOG_DIR)
        self.interval_var = int_type(value=BATCH_INTERVAL)

        def add_row(label, var, show=None, browse=False):
            row = ttk.Frame(cfg)
            ttk.Label(row, text=label, width=18).pack(side="left", padx=5)
            entry = ttk.Entry(row, textvariable=var, show=show)
            entry.pack(side="left", fill="x", expand=True, padx=5)
            if browse:
                if HAS_TTKBOOTSTRAP:
                    ttk.Button(row, text="Browse", command=self.browse_dir).pack(side="left", padx=5)
                else:
                    ttk.Button(row, text="Browse", command=self.browse_dir).pack(side="left", padx=5)
            row.pack(fill="x", pady=4)

        add_row("Backend URL", self.backend_var)
        add_row("Email", self.email_var)
        add_row("Password", self.password_var, show="•")
        add_row("Device ID", self.device_id_var)
        add_row("Device Name", self.device_name_var)
        add_row("Log Directory", self.log_dir_var, browse=True)
        add_row("Batch Interval (s)", self.interval_var)

        control_frame = ttk.Frame(self.tab_settings)
        control_frame.pack(fill="x", pady=10)

        if HAS_TTKBOOTSTRAP:
            self.start_btn = ttk.Button(control_frame, text="▶ Start", bootstyle=SUCCESS, command=self.start)
            self.stop_btn = ttk.Button(control_frame, text="⏹ Stop", bootstyle=DANGER, command=self.stop, state="disabled")
            self.save_btn = ttk.Button(control_frame, text="💾 Save Config", command=self.save_config, bootstyle=INFO)
        else:
            self.start_btn = ttk.Button(control_frame, text="▶ Start", command=self.start)
            self.stop_btn = ttk.Button(control_frame, text="⏹ Stop", command=self.stop, state="disabled")
            self.save_btn = ttk.Button(control_frame, text="💾 Save Config", command=self.save_config)

        self.start_btn.pack(side="left", padx=6)
        self.stop_btn.pack(side="left", padx=6)
        self.save_btn.pack(side="right", padx=6)

        status_bar = ttk.Frame(self.tab_settings)
        ttk.Label(status_bar, text="Status:").pack(side="left", padx=5)
        if HAS_TTKBOOTSTRAP:
            ttk.Label(status_bar, textvariable=self.status_var, bootstyle=INFO).pack(side="left")
        else:
            ttk.Label(status_bar, textvariable=self.status_var).pack(side="left")
        status_bar.pack(fill="x", pady=(8, 0))

    def _build_logs_tab(self):
        if HAS_TTKBOOTSTRAP:
            log_frame = ttk.Labelframe(self.tab_logs, text="Client Logs", padding=10)
        else:
            log_frame = ttk.LabelFrame(self.tab_logs, text="Client Logs", padding=10)
        log_frame.pack(fill="both", expand=True)
        # Text widget is always from tkinter, not ttk (neither tkinter.ttk nor ttkbootstrap have Text)
        # ttkbootstrap.Text might exist, but we'll use tk.Text for compatibility
        self.text = tk.Text(log_frame, height=20, wrap="word", bg="#1a1a1a", fg="#ffffff", insertbackground="#ffffff", font=("Consolas", 10))
        self.text.pack(fill="both", expand=True)
        self.text.tag_configure("info", foreground="#61dafb")
        self.text.tag_configure("success", foreground="#4caf50")
        self.text.tag_configure("error", foreground="#e57373")

    def browse_dir(self):
        # filedialog is from tkinter, not ttk
        path = filedialog.askdirectory()
        if path:
            self.log_dir_var.set(path)

    def save_config(self):
        cfg = {
            "BACKEND_URL": self.backend_var.get(),
            "CLIENT_EMAIL": self.email_var.get(),
            "CLIENT_PASSWORD": self.password_var.get(),  # Save password to config
            "DEVICE_ID": self.device_id_var.get(),
            "DEVICE_NAME": self.device_name_var.get(),
            "LOG_DIR": self.log_dir_var.get(),
            "BATCH_INTERVAL": self.interval_var.get(),
        }
        with open("client_config.json", "w") as f:
            json.dump(cfg, f, indent=2)
        if HAS_TTKBOOTSTRAP:
            Messagebox.show_info("Configuration saved to client_config.json", "Saved")
        else:
            messagebox.showinfo("Saved", "Configuration saved to client_config.json")

    def start(self):
        global BACKEND_URL, CLIENT_EMAIL, CLIENT_PASSWORD, DEVICE_ID, DEVICE_NAME, LOG_DIR, BATCH_INTERVAL, _token, _stop_event
        BACKEND_URL = self.backend_var.get().strip()
        CLIENT_EMAIL = self.email_var.get().strip()
        CLIENT_PASSWORD = self.password_var.get().strip()
        DEVICE_ID = self.device_id_var.get().strip() or DEVICE_ID
        DEVICE_NAME = self.device_name_var.get().strip() or DEVICE_ID
        LOG_DIR = self.log_dir_var.get().strip() or LOG_DIR
        try:
            BATCH_INTERVAL = int(self.interval_var.get())
        except:
            BATCH_INTERVAL = 60
        
        # Validate required fields
        if not CLIENT_EMAIL or not CLIENT_PASSWORD:
            if HAS_TTKBOOTSTRAP:
                Messagebox.show_error("Email and Password are required to start the agent.", "Missing Credentials")
            else:
                messagebox.showerror("Missing Credentials", "Email and Password are required to start the agent.")
            return
        
        if not BACKEND_URL:
            if HAS_TTKBOOTSTRAP:
                Messagebox.show_error("Backend URL is required.", "Missing Configuration")
            else:
                messagebox.showerror("Missing Configuration", "Backend URL is required.")
            return
        
        log_ui(f"[System] Configuration:")
        log_ui(f"  Backend URL: {BACKEND_URL}")
        log_ui(f"  Email: {CLIENT_EMAIL}")
        log_ui(f"  Device ID: {DEVICE_ID}")
        log_ui(f"  Device Name: {DEVICE_NAME}")
        log_ui(f"  Log Directory: {LOG_DIR}")
        log_ui(f"  Batch Interval: {BATCH_INTERVAL}s")
        
        _token = None
        _stop_event.clear()
        self.running = True
        self.status_var.set("Running...")
        self.start_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")
        threading.Thread(target=run_agent_loop, daemon=True).start()
        log_ui("[System] ✅ Agent started")

    def stop(self):
        global _stop_event
        _stop_event.set()
        self.running = False
        self.status_var.set("Stopped")
        self.start_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        log_ui("[System] Agent stopping...")

    def drain_queue(self):
        try:
            while True:
                msg = _ui_queue.get_nowait()
                tag = "info"
                if "✅" in msg:
                    tag = "success"
                elif "❌" in msg or "Error" in msg or "Failed" in msg:
                    tag = "error"
                self.text.insert("end", msg + "\n", tag)
                self.text.see("end")
        except queue.Empty:
            pass
        self.app.after(400, self.drain_queue)

    def on_close(self):
        if self.running:
            if HAS_TTKBOOTSTRAP:
                if not Messagebox.okcancel("Agent is still running. Stop and exit?", "Confirm Exit"):
                    return
            else:
                if not messagebox.askokcancel("Confirm Exit", "Agent is still running. Stop and exit?"):
                    return
            _stop_event.set()
        self.app.destroy()

def main():
    if tk is None and not HAS_TTKBOOTSTRAP:
        print("tkinter not available; running headless loop.")
        run_agent_loop()
        return
    gui = LogChainGUI()
    gui.app.mainloop()

if __name__ == "__main__":
    main()
