"use client"

import { useState } from "react"
import { Link2, Check, Upload, Server, User, Clock } from "lucide-react"
import Card from "../components/Card"
import Badge from "../components/Badge"

export default function Activity() {
  const [filterType, setFilterType] = useState("all")
  const [filterDevice, setFilterDevice] = useState("all")
  const [dateRange, setDateRange] = useState("today")

  const [activities] = useState([
    {
      id: 1,
      type: "anchor",
      title: "Batch Anchored to Blockchain",
      description: "Batch #1247 from server-prod-01 successfully anchored",
      timestamp: "2025-01-28 10:30:45",
      device: "server-prod-01",
      user: "system",
      metadata: {
        batchId: "batch-1247",
        txHash: "0x9c4d1e...",
        blockNumber: 18234567,
      },
      status: "success",
    },
    {
      id: 2,
      type: "verification",
      title: "Verification Completed",
      description: "Batch #1246 verified successfully",
      timestamp: "2025-01-28 10:25:12",
      device: "server-prod-01",
      user: "admin@example.com",
      metadata: {
        batchId: "batch-1246",
        result: "verified",
      },
      status: "success",
    },
    {
      id: 3,
      type: "upload",
      title: "New Batch Uploaded",
      description: "Batch uploaded and queued for anchoring",
      timestamp: "2025-01-28 10:20:33",
      device: "server-prod-02",
      user: "system",
      metadata: {
        batchId: "batch-1245",
        size: "8.7 KB",
      },
      status: "success",
    },
    {
      id: 4,
      type: "verification",
      title: "Verification Failed",
      description: "Tampering detected in batch #1240",
      timestamp: "2025-01-28 10:15:22",
      device: "server-staging-01",
      user: "admin@example.com",
      metadata: {
        batchId: "batch-1240",
        result: "failed",
        reason: "Hash mismatch",
      },
      status: "error",
    },
    {
      id: 5,
      type: "device",
      title: "Device Connected",
      description: "server-prod-03 came online",
      timestamp: "2025-01-28 10:10:05",
      device: "server-prod-03",
      user: "system",
      metadata: {
        version: "v1.2.3",
      },
      status: "success",
    },
    {
      id: 6,
      type: "device",
      title: "Device Disconnected",
      description: "server-staging-01 went offline",
      timestamp: "2025-01-28 09:45:18",
      device: "server-staging-01",
      user: "system",
      metadata: {
        lastSeen: "2 hours ago",
      },
      status: "warning",
    },
    {
      id: 7,
      type: "user",
      title: "User Login",
      description: "admin@example.com logged in",
      timestamp: "2025-01-28 09:30:00",
      device: null,
      user: "admin@example.com",
      metadata: {
        ip: "192.168.1.100",
      },
      status: "success",
    },
  ])

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
    return matchesType && matchesDevice
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Activity Trail</h1>
        <p className="text-gray-400">Complete audit log of all system events</p>
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
              <option value="server-prod-01">server-prod-01</option>
              <option value="server-prod-02">server-prod-02</option>
              <option value="server-staging-01">server-staging-01</option>
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
        <div className="space-y-4">
          {filteredActivities.map((activity, index) => (
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
                  <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {activity.timestamp}</span>
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
