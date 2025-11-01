"use client"

import { useEffect, useState } from "react"
import Card from "../components/Card"
import Badge from "../components/Badge"
import { listBatches, anchorBatch, verifyBatch } from "../api/batches"

export default function Logs() {
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionMsg, setActionMsg] = useState("")

  const fetchBatches = async () => {
    try {
      setLoading(true)
      const res = await listBatches()
      setBatches(
        Array.isArray(res)
          ? res.map((b) => ({
              id: b.id,
              batchId: b.batch_id || "—",
              merkleRoot: b.merkle_root,
              timestamp: b.created_at ? new Date(b.created_at).toLocaleString() : "—",
              size: b.size || 0,
              device: b.device_id || "—",
              status: b.anchored === 1 ? "anchored" : "pending",
              txHash: b.tx_hash,
              blockNumber: b.tx_block,
              ipfsCid: b.ipfs_cid || "—",
              logsCount: b.size || 0,
            }))
          : []
      )
      setError("")
    } catch (err) {
      setError(err.message || "Failed to load batches")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
    // Auto-refresh every 15 seconds to show new batches
    const interval = setInterval(fetchBatches, 15000)
    return () => clearInterval(interval)
  }, [])

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      (batch.batchId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch.device || "").toLowerCase().includes(searchTerm.toLowerCase())
    let matchesFilter = true
    if (filterStatus === "all") matchesFilter = true
    else if (filterStatus === "anchored") matchesFilter = batch.status === "anchored"
    else if (filterStatus === "verified") matchesFilter = batch.status === "anchored" // verified means anchored
    else if (filterStatus === "pending") matchesFilter = batch.status === "pending"
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Log Batches</h1>
        <p className="text-gray-400">View and manage anchored log batches</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-secondary" onClick={fetchBatches}>Refresh</button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by batch ID or device..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex gap-2">
            {["all", "anchored", "verified", "pending"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-gradient-primary text-white"
                    : "bg-dark-700 text-gray-400 hover:text-white"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Batches Table */}
      <Card>
        <div className="overflow-x-auto">
          {loading && <div className="text-gray-400 p-4">Loading batches...</div>}
          {error && (
            <div className="text-red-400 p-4">
              {error}
              {(error.toLowerCase().includes("401") || error.toLowerCase().includes("unauthorized")) && (
                <span className="block text-gray-400">You may need to log in again.</span>
              )}
            </div>
          )}
          {!loading && !error && batches.length === 0 && (
            <div className="text-gray-400 p-4 text-center py-8">No batches yet. Once your agent sends logs, they will appear here.</div>
          )}
          {!loading && !error && filteredBatches.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Batch ID</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Device</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Timestamp</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Logs</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((batch, index) => (
                <tr
                  key={batch.id}
                  className="border-b border-dark-600/50 hover:bg-dark-700/30 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="py-4 px-4">
                    <span className="text-white font-mono text-sm">{batch.batchId}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-300">{batch.device}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-400 text-sm">{batch.timestamp}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-white font-medium">{batch.logsCount}</span>
                  </td>
                  <td className="py-4 px-4">
                    <Badge status={batch.status === "anchored" || batch.status === "verified" ? "verified" : "offline"}>
                      {batch.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={() => setSelectedBatch(batch)}
                        className="text-neon-indigo hover:text-neon-purple transition-colors text-sm font-medium"
                      >
                        Details
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            setActionMsg("")
                            const res = await anchorBatch(batch.id)
                            setActionMsg(`Anchored: ${res.tx_hash || "ok"}`)
                            await fetchBatches()
                          } catch (e) {
                            setActionMsg(`Anchor failed: ${e.message}`)
                          }
                        }}
                        className="text-sm btn-secondary"
                      >
                        Anchor
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            setActionMsg("")
                            const res = await verifyBatch(batch.id)
                            setActionMsg(res.anchored_onchain ? "Verified on-chain" : "Not found on-chain")
                          } catch (e) {
                            setActionMsg(`Verify failed: ${e.message}`)
                          }
                        }}
                        className="text-sm btn-secondary"
                      >
                        Verify
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
          {actionMsg && <div className="p-3 text-sm text-gray-300">{actionMsg}</div>}
        </div>
      </Card>

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedBatch(null)}
        >
          <div
            className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Batch Details</h2>
                <p className="text-gray-400 font-mono text-sm">{selectedBatch.batchId}</p>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Batch Info */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Batch Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-dark-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Status</p>
                    <Badge
                      status={
                        selectedBatch.status === "anchored" || selectedBatch.status === "verified"
                          ? "verified"
                          : "offline"
                      }
                    >
                      {selectedBatch.status}
                    </Badge>
                  </div>
                  <div className="bg-dark-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Device</p>
                    <p className="text-white font-medium">{selectedBatch.device}</p>
                  </div>
                  <div className="bg-dark-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Timestamp</p>
                    <p className="text-white font-medium">{selectedBatch.timestamp}</p>
                  </div>
                  <div className="bg-dark-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Size</p>
                    <p className="text-white font-medium">{(selectedBatch.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              </div>

              {/* Merkle Root */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Merkle Root</h3>
                <div className="bg-dark-700/50 p-4 rounded-lg">
                  <p className="text-white font-mono text-sm break-all">{selectedBatch.merkleRoot}</p>
                </div>
              </div>

              {/* Blockchain Info */}
              {selectedBatch.txHash && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Blockchain Anchor</h3>
                  <div className="space-y-3">
                    <div className="bg-dark-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Transaction Hash</p>
                      <p className="text-white font-mono text-sm break-all">{selectedBatch.txHash}</p>
                    </div>
                    <div className="bg-dark-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Block Number</p>
                      <p className="text-white font-medium">{selectedBatch.blockNumber?.toLocaleString()}</p>
                    </div>
                    <div className="bg-dark-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">IPFS CID</p>
                      <p className="text-white font-mono text-sm">{selectedBatch.ipfsCid}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Merkle Tree Visualization */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Merkle Tree Structure</h3>
                <div className="bg-dark-700/50 p-6 rounded-lg">
                  <div className="flex flex-col items-center space-y-4">
                    {/* Root */}
                    <div className="bg-gradient-primary p-3 rounded-lg text-white font-mono text-xs">
                      Root: {selectedBatch.merkleRoot.slice(0, 10)}...
                    </div>
                    {/* Level 1 */}
                    <div className="flex gap-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="bg-neon-indigo/20 border border-neon-indigo p-2 rounded text-xs">
                          Node {i}
                        </div>
                      ))}
                    </div>
                    {/* Level 2 */}
                    <div className="flex gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-dark-600 p-2 rounded text-xs text-gray-400">
                          Leaf {i}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="btn-primary flex-1">Verify Batch</button>
                <button className="btn-secondary flex-1">Get Merkle Proof</button>
                <button className="btn-secondary">View on Explorer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
