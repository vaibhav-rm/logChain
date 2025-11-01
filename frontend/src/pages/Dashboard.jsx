"use client"

import { useState, useEffect } from "react"
import { Link2, Server, Hourglass, Check, Upload, CheckCircle2, RefreshCw } from "lucide-react"
import Card from "../components/Card"
import Badge from "../components/Badge"
import { listBatches, getOnchainTotal } from "../api/batches"
import { listDevices } from "../api/devices"

export default function Dashboard() {
  const [liveEvents, setLiveEvents] = useState([])
  const [batches, setBatches] = useState([])
  const [devices, setDevices] = useState([])
  const [stats, setStats] = useState({
    totalBatches: 0,
    anchoredBatches: 0,
    pendingBatches: 0,
    totalDevices: 0,
    onlineDevices: 0,
    onchainTotal: 0,
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [batchesRes, devicesRes, onchainRes] = await Promise.all([
        listBatches().catch(() => []),
        listDevices().catch(() => []),
        getOnchainTotal().catch(() => ({ total_batches: 0 })),
      ])

      const batchesData = Array.isArray(batchesRes) ? batchesRes : []
      const devicesData = Array.isArray(devicesRes) ? devicesRes : []

      // Sort batches by created_at desc (most recent first)
      batchesData.sort((a, b) => {
        let aTime = 0
        let bTime = 0
        try {
          if (a.created_at) {
            let aStr = a.created_at
            if (typeof aStr === 'string' && !aStr.endsWith('Z') && !aStr.includes('+') && !aStr.includes('-', 10)) {
              aStr = aStr + 'Z'
            }
            aTime = new Date(aStr).getTime()
          }
          if (b.created_at) {
            let bStr = b.created_at
            if (typeof bStr === 'string' && !bStr.endsWith('Z') && !bStr.includes('+') && !bStr.includes('-', 10)) {
              bStr = bStr + 'Z'
            }
            bTime = new Date(bStr).getTime()
          }
        } catch (e) {
          console.error("Error parsing batch dates:", e, a.created_at, b.created_at)
        }
        return bTime - aTime
      })

      setBatches(batchesData)
      setDevices(devicesData)

      // Calculate stats
      const anchored = batchesData.filter(b => b.anchored === 1).length
      const pending = batchesData.filter(b => b.anchored === 0).length
      const now = Date.now()
      const onlineDevices = devicesData.filter(d => {
        if (!d.last_seen) return false
        try {
          // Handle both string and object dates, ensure UTC handling
          let lastSeenTime
          if (typeof d.last_seen === 'string') {
            // Ensure UTC format
            let dateStr = d.last_seen
            if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
              dateStr = dateStr + 'Z'  // Assume UTC if no timezone
            }
            lastSeenTime = new Date(dateStr).getTime()
          } else if (d.last_seen && typeof d.last_seen === 'object') {
            // MongoDB datetime object
            lastSeenTime = new Date(d.last_seen.$date || d.last_seen.isoDate || d.last_seen).getTime()
          } else {
            lastSeenTime = new Date(d.last_seen).getTime()
          }
          if (isNaN(lastSeenTime)) {
            console.warn("Invalid last_seen for device:", d.device_id, d.last_seen)
            return false
          }
          // Device is online if last_seen is within 6 minutes (allowing for heartbeat interval of 30s + network delay)
          const isOnline = (now - lastSeenTime) < 6 * 60 * 1000 // 6 minutes
          return isOnline
        } catch (e) {
          console.error("Error parsing last_seen for device:", d.device_id, e, d.last_seen)
          return false
        }
      }).length

      setStats({
        totalBatches: batchesData.length,
        anchoredBatches: anchored,
        pendingBatches: pending,
        totalDevices: devicesData.length,
        onlineDevices,
        onchainTotal: onchainRes.total_batches || 0,
      })

      // Generate live events from batches
      const events = []
      batchesData.slice(0, 10).forEach(batch => {
        if (batch.anchored === 1 && batch.tx_hash) {
          events.push({
            id: batch.id,
            type: "anchor",
            message: `Batch ${batch.batch_id || batch.id.slice(0, 8)} anchored to blockchain`,
            timestamp: formatTimeAgo(batch.created_at),
            status: "verified",
            batch: batch,
          })
        } else if (batch.anchored === 0) {
          events.push({
            id: batch.id,
            type: "upload",
            message: `New batch from ${batch.device_id || "unknown device"}`,
            timestamp: formatTimeAgo(batch.created_at),
            status: "online",
            batch: batch,
          })
        }
      })
      setLiveEvents(events)
      setLastUpdate(new Date())
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "—"
    try {
      // Ensure UTC string format is handled correctly
      let dateStr = dateString
      if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
        // If it's an ISO string without timezone, assume UTC
        dateStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z'
      }
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateString)
        return "—"
      }
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      
      // Handle negative differences (future dates) - shouldn't happen but handle gracefully
      if (diffMs < 0) return "Just now"
      
      const diffSecs = Math.floor(diffMs / 1000)
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffSecs < 10) return "Just now"
      if (diffMins < 1) return `${diffSecs} sec ago`
      if (diffMins < 60) return `${diffMins} min ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    } catch (e) {
      console.error("Error formatting time ago:", e, dateString)
      return "—"
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  // Find the most recently anchored batch (anchored batches sorted by created_at desc)
  const lastAnchored = batches.find(b => b.anchored === 1 && b.tx_hash)
  const offlineDevices = stats.totalDevices - stats.onlineDevices

  const summaryCards = [
    {
      title: "Last Anchored",
      value: lastAnchored ? formatTimeAgo(lastAnchored.created_at) : "—",
      subtitle: lastAnchored ? `Batch ${lastAnchored.batch_id || lastAnchored.id.slice(0, 8)}` : "No anchors yet",
      icon: <Link2 className="w-7 h-7 text-neon-indigo" />,
      status: lastAnchored ? "verified" : "offline",
    },
    {
      title: "Devices Online",
      value: `${stats.onlineDevices}/${stats.totalDevices}`,
      subtitle: offlineDevices > 0 ? `${offlineDevices} offline` : "All online",
      icon: <Server className="w-7 h-7 text-neon-indigo" />,
      status: stats.onlineDevices > 0 ? "online" : "offline",
    },
    {
      title: "Pending Anchors",
      value: stats.pendingBatches.toString(),
      subtitle: "Queued for anchoring",
      icon: <Hourglass className="w-7 h-7 text-neon-indigo" />,
      status: stats.pendingBatches > 0 ? "offline" : "verified",
    },
    {
      title: "On-Chain Total",
      value: stats.onchainTotal.toString(),
      subtitle: `${stats.anchoredBatches} in database`,
      icon: <Check className="w-7 h-7 text-neon-indigo" />,
      status: stats.onchainTotal > 0 ? "verified" : "offline",
    },
  ]

  // Generate timeline from recent batches (last 4)
  const timelineData = batches.slice(0, 4).map(batch => {
    const date = batch.created_at ? new Date(batch.created_at) : new Date()
    const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    return {
      time,
      status: batch.anchored === 1 ? "verified" : "offline",
      label: `Batch ${batch.batch_id || batch.id.slice(0, 8)}`,
      batch,
    }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Monitor your log anchoring and verification status</p>
        </div>
        <button className="btn-secondary" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 inline mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => (
          <Card
            key={index}
            animated
            className="hover:scale-105 transition-transform duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">{card.icon}</div>
              <Badge status={card.status}>{card.status}</Badge>
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
            <p className="text-xs text-gray-500">{card.subtitle}</p>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Live Feed */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Live Activity Feed</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live</span>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {liveEvents.map((event, index) => (
              <div
                key={event.id}
                className="flex items-start gap-4 p-4 bg-dark-700/50 rounded-lg border border-dark-600/50 
                           hover:border-neon-indigo/30 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="shrink-0 w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  {event.type === "anchor" ? (
                    <Link2 className="w-5 h-5 text-white" />
                  ) : event.type === "upload" ? (
                    <Upload className="w-5 h-5 text-white" />
                  ) : (
                    <Check className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white mb-1">{event.message}</p>
                  <p className="text-xs text-gray-500">{event.timestamp}</p>
                </div>
                <Badge status={event.status}>{event.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-6">Quick Stats</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Total Batches</span>
                <span className="text-lg font-bold text-white">{stats.totalBatches}</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div className="bg-gradient-primary h-2 rounded-full" style={{ width: stats.totalBatches > 0 ? "100%" : "0%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Anchored Batches</span>
                <span className="text-lg font-bold text-white">{stats.anchoredBatches}/{stats.totalBatches}</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div className="bg-neon-cyan h-2 rounded-full" style={{ width: stats.totalBatches > 0 ? `${(stats.anchoredBatches / stats.totalBatches) * 100}%` : "0%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Pending Anchors</span>
                <span className="text-lg font-bold text-white">{stats.pendingBatches}</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div className="bg-neon-purple h-2 rounded-full" style={{ width: stats.totalBatches > 0 ? `${(stats.pendingBatches / stats.totalBatches) * 100}%` : "0%" }}></div>
              </div>
            </div>

            {lastUpdate && (
              <div className="pt-4 border-t border-dark-600 text-xs text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}

            <div className="pt-4 border-t border-dark-600">
              <button className="btn-primary w-full text-sm">View Full Report</button>
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline Visualization */}
      <Card>
        <h2 className="text-xl font-bold text-white mb-6">Anchor Timeline</h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-dark-600"></div>

          {/* Timeline points */}
          <div className={`relative flex ${timelineData.length > 0 ? "justify-between" : "justify-center"} items-start`}>
            {timelineData.length === 0 ? (
              <div className="text-gray-400 text-sm py-8">No batches yet. Start your client to begin logging.</div>
            ) : timelineData.map((point, index) => (
              <div
                key={index}
                className="flex flex-col items-center animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 z-10 
                              ${
                                point.status === "verified"
                                  ? "bg-neon-cyan/20 border-2 border-neon-cyan"
                                  : "bg-dark-700 border-2 border-dark-600"
                              }`}
                >
                  {point.status === "verified" ? (
                    <Check className="w-5 h-5 text-neon-cyan" />
                  ) : (
                    <Hourglass className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <span className="text-xs font-medium text-gray-400 mb-1">{point.time}</span>
                <span className="text-xs text-gray-500">{point.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

