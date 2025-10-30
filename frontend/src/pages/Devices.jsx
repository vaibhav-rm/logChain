"use client"

import { useEffect, useState } from "react"
import Card from "../components/Card"
import Badge from "../components/Badge"
import { listDevices, registerDevice } from "../api/devices"

export default function Devices() {
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await listDevices()
        if (!mounted) return
        setDevices(
          Array.isArray(res)
            ? res.map((d) => ({
                id: d.device_id,
                name: d.name,
                platform: "Unknown platform",
                status: "online",
                lastSeen: "—",
                version: "—",
                monitoredPaths: [],
                lastHash: "—",
                lastAnchor: "—",
                storageSize: "—",
                logsCount: 0,
              }))
            : []
        )
      } catch (err) {
        setError(err.message || "Failed to load devices")
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Devices</h1>
          <p className="text-gray-400">Manage your LogChain client agents</p>
        </div>
        <button className="btn-primary">Add Device</button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card animated>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Devices</p>
              <p className="text-3xl font-bold text-white">{devices.length}</p>
            </div>
            <div className="text-4xl">💻</div>
          </div>
        </Card>
        <Card animated style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Online</p>
              <p className="text-3xl font-bold text-green-400">{devices.filter((d) => d.status === "online").length}</p>
            </div>
            <div className="text-4xl">✓</div>
          </div>
        </Card>
        <Card animated style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Offline</p>
              <p className="text-3xl font-bold text-red-400">{devices.filter((d) => d.status === "offline").length}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </Card>
      </div>

      {/* Devices List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {loading && <div className="text-gray-400">Loading devices...</div>}
        {error && <div className="text-red-400">{error}</div>}
        {!loading && !error && devices.map((device, index) => (
          <Card
            key={device.id}
            animated
            className="cursor-pointer hover:border-neon-indigo/50 transition-all duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => setSelectedDevice(device)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center text-xl">
                  💻
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{device.name}</h3>
                  <p className="text-sm text-gray-400">{device.platform}</p>
                </div>
              </div>
              <Badge status={device.status}>{device.status}</Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Last Seen</span>
                <span className="text-white font-medium">{device.lastSeen}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Agent Version</span>
                <span className="text-white font-medium">{device.version}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Last Anchor</span>
                <span className="text-white font-medium">{device.lastAnchor}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Storage</span>
                <span className="text-white font-medium">{device.storageSize}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-dark-600">
              <button className="text-sm text-neon-indigo hover:text-neon-purple transition-colors">
                View Details →
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDevice(null)}
        >
          <div
            className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-primary rounded-lg flex items-center justify-center text-2xl">
                  💻
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedDevice.name}</h2>
                  <p className="text-gray-400">{selectedDevice.platform}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDevice(null)}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Status Section */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Status</p>
                    <Badge status={selectedDevice.status}>{selectedDevice.status}</Badge>
                  </div>
                  <div className="bg-dark-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Last Seen</p>
                    <p className="text-white font-medium">{selectedDevice.lastSeen}</p>
                  </div>
                  <div className="bg-dark-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Agent Version</p>
                    <p className="text-white font-medium">{selectedDevice.version}</p>
                  </div>
                  <div className="bg-dark-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Device ID</p>
                    <p className="text-white font-medium text-xs">{selectedDevice.id}</p>
                  </div>
                </div>
              </div>

              {/* Monitored Paths */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Monitored Paths</h3>
                <div className="space-y-2">
                  {selectedDevice.monitoredPaths.map((path, index) => (
                    <div key={index} className="bg-dark-700/50 p-3 rounded-lg flex items-center justify-between">
                      <span className="text-white font-mono text-sm">{path}</span>
                      <Badge status="online">active</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anchor Info */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Latest Anchor</h3>
                <div className="bg-dark-700/50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Batch</span>
                    <span className="text-white font-medium">{selectedDevice.lastAnchor}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Merkle Root</span>
                    <span className="text-white font-mono text-sm">{selectedDevice.lastHash}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Logs</span>
                    <span className="text-white font-medium">{selectedDevice.logsCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Storage Used</span>
                    <span className="text-white font-medium">{selectedDevice.storageSize}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="btn-primary flex-1">Force Re-scan</button>
                <button className="btn-secondary flex-1">Pause Agent</button>
                <button className="btn-secondary">Download Logs</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
