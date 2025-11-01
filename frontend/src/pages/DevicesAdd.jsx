"use client"

import React from "react"
import Card from "../components/Card"
import { Link } from "react-router-dom"

export default function DevicesAdd() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Add & Link Device</h1>
        <p className="text-gray-400">Follow these instructions to download and link the LogChain client to your account.</p>
      </div>

      <Card>
        <h2 className="text-xl font-bold text-white mb-4">Step 1 — Register Device</h2>
        <p className="text-gray-300 mb-4">On the previous page you registered a device ID. Keep that ID handy — you'll need it when configuring the client.</p>

        <h2 className="text-xl font-bold text-white mb-4">Step 2 — Download the client</h2>
        <p className="text-gray-300 mb-2">Clone or download the client repository and install the dependencies:</p>
        <pre className="bg-dark-800 p-3 rounded text-sm text-gray-200 font-mono">git clone &lt;repo_url&gt; logChain-client
cd logChain-client
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt</pre>

        <h2 className="text-xl font-bold text-white mb-4">Step 3 — Configure the client</h2>
        <p className="text-gray-300 mb-2">Create a <code className="font-mono">.env</code> file in the <code className="font-mono">logChain-client</code> folder with the following values:</p>
        <pre className="bg-dark-800 p-3 rounded text-sm text-gray-200 font-mono">BACKEND_URL={window.location.origin}
CLIENT_EMAIL=you@example.com
CLIENT_PASSWORD=yourpassword
DEVICE_ID=the-device-id-you-registered
DEVICE_NAME=MyServer01
LOG_DIR=/path/to/logs
BATCH_INTERVAL=60
</pre>
        <p className="text-gray-300">Then start the client:</p>
        <pre className="bg-dark-800 p-3 rounded text-sm text-gray-200 font-mono">python client.py</pre>

        <h2 className="text-xl font-bold text-white mb-4">Step 4 — Verify</h2>
        <p className="text-gray-300 mb-2">After starting, the client will register the device, send heartbeats, compute Merkle roots and send batches. Visit the <Link to="/devices" className="text-neon-indigo">Devices</Link> and <Link to="/logs" className="text-neon-indigo">Logs</Link> pages to monitor activity.</p>

        <div className="mt-6">
          <Link to="/devices" className="btn-primary">Back to Devices</Link>
        </div>
      </Card>
    </div>
  )
}
