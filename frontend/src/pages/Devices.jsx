"use client"

import { useEffect, useState } from "react"
import { Server, CheckCircle2, AlertTriangle, RefreshCw, Plus, Trash2 } from "lucide-react"
import Card from "../components/Card"
import Badge from "../components/Badge"
import { listDevices, registerDevice, deleteDevice } from "../api/devices"

export default function Devices() {
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({ device_id: "", name: "" })

  const fetchDevices = async () => {
    try {
      setLoading(true)
      // Request devices with batch info included to avoid separate API call
      const res = await listDevices(true) // Pass true to include batch info
      const devicesData = Array.isArray(res) ? res : []
      
      // Build batchesByDevice from included batch info
      let batchesByDevice = {}
      devicesData.forEach(device => {
        if (device.last_anchor) {
          const deviceId = device.device_id
          if (!batchesByDevice[deviceId]) {
            batchesByDevice[deviceId] = []
          }
          // Use the last_anchor data if available
          batchesByDevice[deviceId].push({
            batch_id: device.last_anchor.batch_id,
            merkle_root: device.last_anchor.merkle_root,
            created_at: device.last_anchor.created_at,
            anchored: 1,
          })
        }
      })

      setDevices(
        devicesData.map((d) => {
          let lastSeen = null
          if (d.last_seen) {
            try {
              // Handle ISO string, date object, or MongoDB datetime
              if (typeof d.last_seen === 'string') {
                // Ensure UTC format for proper parsing
                let dateStr = d.last_seen
                if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
                  dateStr = dateStr + 'Z'  // Assume UTC if no timezone indicator
                }
                lastSeen = new Date(dateStr)
              } else if (d.last_seen && typeof d.last_seen === 'object') {
                // MongoDB datetime might be passed as object with $date or isoDate
                lastSeen = new Date(d.last_seen.$date || d.last_seen.isoDate || d.last_seen)
              } else {
                lastSeen = new Date(d.last_seen)
              }
              // Check if date is valid
              if (isNaN(lastSeen.getTime())) {
                console.warn("Invalid last_seen for device:", d.device_id, d.last_seen)
                lastSeen = null
              }
            } catch (e) {
              console.error("Error parsing last_seen for device:", d.device_id, e, d.last_seen)
              lastSeen = null
            }
          }
          const now = Date.now()
          // Device is online if last_seen is within 6 minutes (allowing for heartbeat interval + network delay)
          const isOnline = lastSeen && (now - lastSeen.getTime()) < 6 * 60 * 1000 // 6 minutes
          
          const storageStr = typeof d.storage_bytes === "number" ? formatBytes(d.storage_bytes) : "—"
          
          // Find last anchor for this device (use included data or fallback)
          const deviceBatches = batchesByDevice[d.device_id] || []
          const lastBatch = deviceBatches.find(b => b.anchored === 1) || deviceBatches[0]
          
          return {
            id: d.device_id,
            name: d.name || d.device_id,
            platform: d.platform || "—",
            status: isOnline ? "online" : "offline",
            lastSeen: lastSeen ? lastSeen.toLocaleString() : "—",
            version: d.version || "—",
            monitoredPaths: [],
            lastHash: lastBatch?.merkle_root?.slice(0, 20) + "..." || "—",
            lastAnchor: lastBatch ? `Batch ${lastBatch.batch_id || lastBatch.id?.slice(0, 8)}` : "—",
            storageSize: storageStr,
            logsCount: d.total_logs || deviceBatches.reduce((sum, b) => sum + (b.size || 0), 0),
          }
        })
      )
      setError("")
    } catch (err) {
      setError(err.message || "Failed to load devices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
    // Auto-refresh every 10 seconds to show updated device status
    const interval = setInterval(fetchDevices, 10000)
    return () => clearInterval(interval)
  }, [])

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "0 B"
    const units = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
  }

  const onAddDevice = async (e) => {
    e.preventDefault()
    if (!form.device_id || !form.name) return
    try {
      setSaving(true)
      await registerDevice({ device_id: form.device_id, name: form.name })
      setShowAdd(false)
      setForm({ device_id: "", name: "" })
      await fetchDevices()
    } catch (err) {
      setError(err.message || "Failed to register device")
    } finally {
      setSaving(false)
    }
  }

  const onDeleteDevice = async (deviceId, deviceName) => {
    if (confirmDelete !== deviceId) {
      setConfirmDelete(deviceId)
      return
    }
    try {
      setDeleting(deviceId)
      await deleteDevice(deviceId)
      setConfirmDelete(null)
      await fetchDevices()
      if (selectedDevice && selectedDevice.id === deviceId) {
        setSelectedDevice(null)
      }
    } catch (err) {
      setError(err.message || "Failed to delete device")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Devices</h1>
          <p className="text-gray-400">Manage your LogChain client agents</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary" onClick={fetchDevices}><RefreshCw className="w-4 h-4 inline mr-2"/>Refresh</button>
          <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 inline mr-2"/>Add Device</button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card animated>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Devices</p>
              <p className="text-3xl font-bold text-white">{devices.length}</p>
            </div>
            <Server className="w-8 h-8 text-neon-indigo" />
          </div>
        </Card>
        <Card animated style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Online</p>
              <p className="text-3xl font-bold text-green-400">{devices.filter((d) => d.status === "online").length}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card animated style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Offline</p>
              <p className="text-3xl font-bold text-red-400">{devices.filter((d) => d.status === "offline").length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Devices List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {loading && <div className="text-gray-400">Loading devices...</div>}
        {error && <div className="text-red-400">{error}</div>}
        {!loading && !error && devices.length === 0 && (
          <Card className="col-span-full">
            <div className="text-gray-400">No devices yet. Click "Add Device" to register your first device.</div>
          </Card>
        )}
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
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Server className="w-6 h-6 text-white" />
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

            <div className="mt-4 pt-4 border-t border-dark-600 flex items-center justify-between">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedDevice(device)
                }}
                className="text-sm text-neon-indigo hover:text-neon-purple transition-colors"
              >
                View Details →
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteDevice(device.id, device.name)
                }}
                disabled={deleting === device.id}
                className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {confirmDelete === device.id ? (
                  <>
                    <span>Confirm?</span>
                    <Trash2 className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </>
                )}
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
                <div className="w-14 h-14 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Server className="w-7 h-7 text-white" />
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
                <button 
                  onClick={() => {
                    if (confirmDelete !== selectedDevice.id) {
                      setConfirmDelete(selectedDevice.id)
                    } else {
                      onDeleteDevice(selectedDevice.id, selectedDevice.name)
                    }
                  }}
                  disabled={deleting === selectedDevice.id}
                  className="btn-secondary flex-1 text-red-400 hover:text-red-300 hover:border-red-400/50 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {confirmDelete === selectedDevice.id ? "Confirm Delete" : "Remove Device"}
                </button>
                <button className="btn-secondary flex-1">Download Logs</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="glass-card max-w-md w-full animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Add Device</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-white transition-colors text-2xl">×</button>
            </div>
            <form onSubmit={onAddDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Device ID</label>
                <input
                  type="text"
                  value={form.device_id}
                  onChange={(e) => setForm((f) => ({ ...f, device_id: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. server-prod-01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  placeholder="Friendly name"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
