"use client"

import { useState } from "react"
import Card from "../components/Card"
import Badge from "../components/Badge"

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account")
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "admin@example.com",
    company: "Acme Corp",
    timezone: "UTC",
  })

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    webhookAlerts: false,
    slackAlerts: true,
    anchorSuccess: true,
    verificationFailed: true,
    deviceOffline: true,
  })

  const tabs = [
    { id: "account", label: "Account", icon: "👤" },
    { id: "devices", label: "Device Setup", icon: "💻" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "blockchain", label: "Blockchain", icon: "⛓️" },
    { id: "api", label: "API Keys", icon: "🔑" },
    { id: "billing", label: "Billing", icon: "💳" },
  ]

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNotificationToggle = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-gradient-primary text-white" : "bg-dark-700 text-gray-400 hover:text-white"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Account Settings */}
      {activeTab === "account" && (
        <Card animated>
          <h2 className="text-xl font-bold text-white mb-6">Account Information</h2>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                <select name="timezone" value={formData.timezone} onChange={handleInputChange} className="input-field">
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                  <option value="GMT">GMT</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-dark-600">
              <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <input type="password" className="input-field" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                    <input type="password" className="input-field" placeholder="••••••••" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn-primary">Save Changes</button>
              <button className="btn-secondary">Cancel</button>
            </div>
          </div>
        </Card>
      )}

      {/* Device Setup */}
      {activeTab === "devices" && (
        <Card animated>
          <h2 className="text-xl font-bold text-white mb-6">Device Setup Keys</h2>
          <div className="space-y-6">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                Keep your device setup keys secure. Anyone with these keys can register devices to your account.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Device Registration Token</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value="logchain_dev_abc123xyz789"
                  readOnly
                  className="input-field font-mono text-sm"
                />
                <button className="btn-secondary whitespace-nowrap">Copy</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Agent Download</label>
              <div className="grid md:grid-cols-3 gap-4">
                {["Linux", "macOS", "Windows"].map((os) => (
                  <button key={os} className="btn-secondary flex items-center justify-center gap-2">
                    <span>📥</span>
                    <span>Download for {os}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-dark-600">
              <button className="btn-primary">Regenerate Token</button>
            </div>
          </div>
        </Card>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <Card animated>
          <h2 className="text-xl font-bold text-white mb-6">Notification Preferences</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Notification Channels</h3>
              <div className="space-y-3">
                {[
                  { key: "emailAlerts", label: "Email Alerts", desc: "Receive notifications via email" },
                  { key: "webhookAlerts", label: "Webhook Alerts", desc: "Send events to custom webhook URL" },
                  { key: "slackAlerts", label: "Slack Alerts", desc: "Post notifications to Slack channel" },
                ].map((channel) => (
                  <div
                    key={channel.key}
                    className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg border border-dark-600/50"
                  >
                    <div>
                      <p className="text-white font-medium">{channel.label}</p>
                      <p className="text-sm text-gray-400">{channel.desc}</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle(channel.key)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications[channel.key] ? "bg-gradient-primary" : "bg-dark-600"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifications[channel.key] ? "translate-x-7" : "translate-x-1"
                        }`}
                      ></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-dark-600">
              <h3 className="text-lg font-semibold text-white mb-4">Event Types</h3>
              <div className="space-y-3">
                {[
                  { key: "anchorSuccess", label: "Anchor Success", desc: "When batches are anchored to blockchain" },
                  {
                    key: "verificationFailed",
                    label: "Verification Failed",
                    desc: "When tampering is detected",
                  },
                  { key: "deviceOffline", label: "Device Offline", desc: "When devices go offline" },
                ].map((event) => (
                  <div
                    key={event.key}
                    className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg border border-dark-600/50"
                  >
                    <div>
                      <p className="text-white font-medium">{event.label}</p>
                      <p className="text-sm text-gray-400">{event.desc}</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle(event.key)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications[event.key] ? "bg-gradient-primary" : "bg-dark-600"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifications[event.key] ? "translate-x-7" : "translate-x-1"
                        }`}
                      ></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary">Save Preferences</button>
          </div>
        </Card>
      )}

      {/* Blockchain Settings */}
      {activeTab === "blockchain" && (
        <Card animated>
          <h2 className="text-xl font-bold text-white mb-6">Blockchain Configuration</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Network</label>
              <select className="input-field">
                <option>Polygon Mainnet</option>
                <option>Ethereum Mainnet</option>
                <option>Sepolia Testnet</option>
                <option>Mumbai Testnet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contract Address</label>
              <input
                type="text"
                value="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                readOnly
                className="input-field font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Gas Strategy</label>
              <select className="input-field">
                <option>Standard (Recommended)</option>
                <option>Fast</option>
                <option>Slow (Cheaper)</option>
              </select>
            </div>

            <div className="bg-dark-700/50 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-3">Current Stats</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Total Anchors</p>
                  <p className="text-white font-bold text-lg">1,247</p>
                </div>
                <div>
                  <p className="text-gray-400">Gas Spent</p>
                  <p className="text-white font-bold text-lg">0.42 ETH</p>
                </div>
              </div>
            </div>

            <button className="btn-primary">Update Configuration</button>
          </div>
        </Card>
      )}

      {/* API Keys */}
      {activeTab === "api" && (
        <Card animated>
          <h2 className="text-xl font-bold text-white mb-6">API Keys</h2>
          <div className="space-y-6">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                API keys provide programmatic access to your LogChain account. Keep them secure.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { name: "Production API Key", key: "lc_prod_abc123...", created: "2025-01-15", status: "active" },
                { name: "Development API Key", key: "lc_dev_xyz789...", created: "2025-01-10", status: "active" },
              ].map((apiKey, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg border border-dark-600/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-white font-medium">{apiKey.name}</p>
                      <Badge status={apiKey.status === "active" ? "online" : "offline"}>{apiKey.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-400 font-mono">{apiKey.key}</p>
                    <p className="text-xs text-gray-500 mt-1">Created: {apiKey.created}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-sm">Copy</button>
                    <button className="btn-secondary text-sm text-red-400">Revoke</button>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-primary">Generate New API Key</button>
          </div>
        </Card>
      )}

      {/* Billing */}
      {activeTab === "billing" && (
        <Card animated>
          <h2 className="text-xl font-bold text-white mb-6">Billing & Usage</h2>
          <div className="space-y-6">
            <div className="bg-gradient-primary p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/80 text-sm">Current Plan</p>
                  <h3 className="text-2xl font-bold text-white">Professional</h3>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">$99</p>
                  <p className="text-white/80 text-sm">per month</p>
                </div>
              </div>
              <button className="btn-secondary w-full bg-white text-dark-900 hover:bg-gray-100">Upgrade Plan</button>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Usage This Month</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Anchored Batches</span>
                    <span className="text-white font-medium">1,247 / 5,000</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div className="bg-gradient-primary h-2 rounded-full" style={{ width: "25%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Storage Used</span>
                    <span className="text-white font-medium">12.4 GB / 50 GB</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div className="bg-neon-cyan h-2 rounded-full" style={{ width: "25%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">API Calls</span>
                    <span className="text-white font-medium">45,230 / 100,000</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div className="bg-neon-purple h-2 rounded-full" style={{ width: "45%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-dark-600">
              <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
              <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg border border-dark-600/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-gradient-primary rounded flex items-center justify-center text-white font-bold text-xs">
                    VISA
                  </div>
                  <div>
                    <p className="text-white font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-gray-400">Expires 12/26</p>
                  </div>
                </div>
                <button className="btn-secondary text-sm">Update</button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
