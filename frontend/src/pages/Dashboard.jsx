"use client"

import { useState, useEffect } from "react"
import { Link2, Server, Hourglass, Check, Upload, CheckCircle2 } from "lucide-react"
import Card from "../components/Card"
import Badge from "../components/Badge"

export default function Dashboard() {
  const [liveEvents, setLiveEvents] = useState([
    {
      id: 1,
      type: "anchor",
      message: "Batch #1247 anchored to blockchain",
      timestamp: "2 minutes ago",
      status: "verified",
    },
    {
      id: 2,
      type: "upload",
      message: "New batch uploaded from server-prod-01",
      timestamp: "5 minutes ago",
      status: "online",
    },
    {
      id: 3,
      type: "verification",
      message: "Verification completed for batch #1246",
      timestamp: "8 minutes ago",
      status: "verified",
    },
  ])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = {
        id: Date.now(),
        type: ["anchor", "upload", "verification"][Math.floor(Math.random() * 3)],
        message: `New event at ${new Date().toLocaleTimeString()}`,
        timestamp: "Just now",
        status: "verified",
      }
      setLiveEvents((prev) => [newEvent, ...prev].slice(0, 10))
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const summaryCards = [
    {
      title: "Last Anchored",
      value: "2 min ago",
      subtitle: "Batch #1247",
      icon: <Link2 className="w-7 h-7 text-neon-indigo" />,
      status: "verified",
    },
    {
      title: "Devices Online",
      value: "12/15",
      subtitle: "3 offline",
      icon: <Server className="w-7 h-7 text-neon-indigo" />,
      status: "online",
    },
    {
      title: "Pending Anchors",
      value: "3",
      subtitle: "Queued for next batch",
      icon: <Hourglass className="w-7 h-7 text-neon-indigo" />,
      status: "offline",
    },
    {
      title: "Last Verification",
      value: "Success",
      subtitle: "8 minutes ago",
      icon: <Check className="w-7 h-7 text-neon-indigo" />,
      status: "verified",
    },
  ]

  const timelineData = [
    { time: "10:00", status: "verified", label: "Batch #1245" },
    { time: "10:15", status: "verified", label: "Batch #1246" },
    { time: "10:30", status: "verified", label: "Batch #1247" },
    { time: "10:45", status: "offline", label: "Pending" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Monitor your log anchoring and verification status</p>
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
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
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
                <span className="text-sm text-gray-400">Anchored Today</span>
                <span className="text-lg font-bold text-white">47</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div className="bg-gradient-primary h-2 rounded-full" style={{ width: "78%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Verified Batches</span>
                <span className="text-lg font-bold text-white">45/47</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div className="bg-neon-cyan h-2 rounded-full" style={{ width: "96%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Storage Used</span>
                <span className="text-lg font-bold text-white">2.4 GB</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div className="bg-neon-purple h-2 rounded-full" style={{ width: "48%" }}></div>
              </div>
            </div>

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
          <div className="relative flex justify-between items-start">
            {timelineData.map((point, index) => (
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
