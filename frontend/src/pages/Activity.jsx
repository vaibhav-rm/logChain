"use client"

import { useState, useEffect } from "react"
import { Link2, Check, Upload, Server, User, Clock, RefreshCw } from "lucide-react"
import Card from "../components/Card"
import Badge from "../components/Badge"
import { listBatches, verifyBatch } from "../api/batches"
import { listDevices } from "../api/devices"

export default function Activity() {
  const [filterType, setFilterType] = useState("all")
  const [filterDevice, setFilterDevice] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [devices, setDevices] = useState([])

  const formatTime = (dateString) => {
    if (!dateString) return "—"
    try {
      let dateStr = dateString
      if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
        dateStr = dateStr + 'Z'
      }
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return "—"
      return date.toLocaleString()
    } catch (e) {
      console.error("Error formatting date:", e, dateString)
      return "—"
    }
  }

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const [batchesData, devicesData] = await Promise.all([
        listBatches(),
        listDevices(),
      ])

      const batches = Array.isArray(batchesData) ? batchesData : []
      const devicesList = Array.isArray(devicesData) ? devicesData : []
      setDevices(devicesList)

      const activityList = []

      // Process batches - create activities for uploads and anchors
      batches.forEach((batch) => {
        const deviceId = batch.device_id || "Unknown"
        
        // Upload activity (when batch was created)
        if (batch.created_at) {
          activityList.push({
            id: `upload-${batch.id}`,
            type: "upload",
            title: "New Batch Uploaded",
            description: `Batch ${batch.batch_id || batch.id.slice(0, 8)} from ${deviceId} uploaded`,
            timestamp: batch.created_at,
            device: deviceId,
            user: "system",
            metadata: {
              batchId: batch.batch_id || batch.id.slice(0, 8),
              size: batch.size ? `${(batch.size / 1024).toFixed(2)} KB` : "—",
              merkleRoot: batch.merkle_root?.slice(0, 20) + "...",
            },
            status: "success",
            sortTime: new Date(batch.created_at + (batch.created_at.endsWith('Z') ? '' : 'Z')).getTime(),
          })
        }

        // Anchor activity (when batch was anchored)
        if (batch.anchored === 1 && batch.tx_hash) {
          activityList.push({
            id: `anchor-${batch.id}`,
            type: "anchor",
            title: "Batch Anchored to Blockchain",
            description: `Batch ${batch.batch_id || batch.id.slice(0, 8)} from ${deviceId} successfully anchored`,
            timestamp: batch.created_at, // Use created_at as anchor timestamp approximation
            device: deviceId,
            user: "system",
            metadata: {
              batchId: batch.batch_id || batch.id.slice(0, 8),
              txHash: batch.tx_hash?.slice(0, 20) + "...",
              blockNumber: batch.tx_block || "—",
            },
            status: "success",
            sortTime: new Date(batch.created_at + (batch.created_at.endsWith('Z') ? '' : 'Z')).getTime(),
          })
        }
      })

      // Process devices - create activities for online/offline status
      const now = Date.now()
      devicesList.forEach((device) => {
        if (!device.last_seen) return
        
        try {
          let lastSeenTime
          if (typeof device.last_seen === 'string') {
            let dateStr = device.last_seen
            if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
              dateStr = dateStr + 'Z'
            }
            lastSeenTime = new Date(dateStr).getTime()
          } else {
            lastSeenTime = new Date(device.last_seen).getTime()
          }

          if (isNaN(lastSeenTime)) return

          const isOnline = (now - lastSeenTime) < 6 * 60 * 1000 // 6 minutes
          const deviceName = device.name || device.device_id

          activityList.push({
            id: `device-${device.device_id}-${isOnline ? 'online' : 'offline'}`,
            type: "device",
            title: isOnline ? "Device Connected" : "Device Disconnected",
            description: `${deviceName} ${isOnline ? "came online" : "went offline"}`,
            timestamp: device.last_seen,
            device: device.device_id,
            user: "system",
            metadata: {
              version: device.version || "—",
              platform: device.platform || "—",
              lastSeen: formatTime(device.last_seen),
            },
            status: isOnline ? "success" : "warning",
            sortTime: lastSeenTime,
          })
        } catch (e) {
          console.error("Error processing device activity:", e, device)
        }
      })

      // Sort by timestamp (most recent first)
      activityList.sort((a, b) => b.sortTime - a.sortTime)
      setActivities(activityList)
      setError("")
    } catch (err) {
      setError(err.message || "Failed to load activities")
      console.error("Error fetching activities:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const eventIcons = {
    anchor: <Link2 className="w-5 h-5 text-white" />,
    verification: <Check className="w-5 h-5 text-white" />,
    upload: <Upload className="w-5 h-5 text-white" />,
    device: <Server className="w-5 h-5 text-white" />,
    user: <User className="w-5 h-5 text-white" />,
  }

  const filteredActivities = activities.filter((activity) => {
    const matchesType = filterType === "all" || activity.type === filterType
    const matchesDevice = filterDevice === "all" || activity.device === filterDevice
    
    // Filter by date range
    let matchesDate = true
    if (dateRange !== "all" && activity.sortTime) {
      const now = Date.now()
      const activityTime = activity.sortTime
      const diff = now - activityTime
      
      switch (dateRange) {
        case "today":
          matchesDate = diff < 24 * 60 * 60 * 1000
          break
        case "week":
          matchesDate = diff < 7 * 24 * 60 * 60 * 1000
          break
        case "month":
          matchesDate = diff < 30 * 24 * 60 * 60 * 1000
          break
        default:
          matchesDate = true
      }
    }
    
    return matchesType && matchesDevice && matchesDate
  })

  const uniqueDevices = Array.from(new Set(activities.map(a => a.device).filter(Boolean)))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Activity Trail</h1>
          <p className="text-gray-400">Complete audit log of all system events</p>
        </div>
        <button className="btn-secondary" onClick={fetchActivities} disabled={loading}>
          <RefreshCw className={`w-4 h-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Event Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field">
              <option value="all">All Events</option>
              <option value="anchor">Anchors</option>
              <option value="verification">Verifications</option>
              <option value="upload">Uploads</option>
              <option value="device">Device Events</option>
              <option value="user">User Actions</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Device</label>
            <select value={filterDevice} onChange={(e) => setFilterDevice(e.target.value)} className="input-field">
              <option value="all">All Devices</option>
              {uniqueDevices.map((deviceId) => (
                <option key={deviceId} value={deviceId}>{deviceId}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Date Range</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="input-field">
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Activity Timeline */}
      <Card>
        {loading && <div className="text-gray-400 py-8 text-center">Loading activities...</div>}
        {error && <div className="text-red-400 py-4">{error}</div>}
        {!loading && !error && filteredActivities.length === 0 && (
          <div className="text-gray-400 py-8 text-center">No activities found. Try adjusting your filters.</div>
        )}
        <div className="space-y-4">
          {!loading && !error && filteredActivities.map((activity, index) => (
            <div
              key={activity.id}
              className="flex gap-4 p-4 bg-dark-700/30 rounded-lg border border-dark-600/50 
                         hover:border-neon-indigo/30 transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${
                    activity.status === "error"
                      ? "bg-red-500/20 border border-red-500/50"
                      : activity.status === "warning"
                        ? "bg-yellow-500/20 border border-yellow-500/50"
                        : "bg-gradient-primary"
                  }`}
                >
                  {eventIcons[activity.type]}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-white font-semibold mb-1">{activity.title}</h3>
                    <p className="text-sm text-gray-400">{activity.description}</p>
                  </div>
                  <Badge
                    status={
                      activity.status === "error" ? "error" : activity.status === "warning" ? "offline" : "verified"
                    }
                  >
                    {activity.status}
                  </Badge>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3">
                  <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {formatTime(activity.timestamp)}</span>
                  {activity.device && <span className="inline-flex items-center gap-1"><Server className="w-3.5 h-3.5"/> {activity.device}</span>}
                  <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5"/> {activity.user}</span>
                </div>

                {/* Additional Details */}
                {activity.metadata && (
                  <div className="mt-3 p-3 bg-dark-800/50 rounded border border-dark-600/30">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-gray-500">{key}: </span>
                          <span className="text-gray-300 font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-dark-600">
          <p className="text-sm text-gray-400">Showing {filteredActivities.length} events</p>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm px-4 py-2">Previous</button>
            <button className="btn-secondary text-sm px-4 py-2">Next</button>
          </div>
        </div>
      </Card>

      {/* Export Options */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Export Activity Log</h3>
            <p className="text-sm text-gray-400">Download complete audit trail for compliance</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary">Export CSV</button>
            <button className="btn-primary">Export JSON</button>
          </div>
        </div>
      </Card>
    </div>
  )
}
