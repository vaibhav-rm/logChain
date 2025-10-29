"use client"

import { useState } from "react"
import Card from "../components/Card"
import Badge from "../components/Badge"

export default function Verification() {
  const [verificationMethod, setVerificationMethod] = useState("file")
  const [logInput, setLogInput] = useState("")
  const [verificationResult, setVerificationResult] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = () => {
    setIsVerifying(true)

    // Simulate verification process
    setTimeout(() => {
      setVerificationResult({
        status: Math.random() > 0.3 ? "verified" : "failed",
        merkleRoot: "0x7f3a2b9c4d1e8f5a6b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
        batchId: "server-1_2025-01-28T10:30",
        timestamp: new Date().toISOString(),
        proofSteps: [
          { level: 0, hash: "0x1a2b3c...", position: "left" },
          { level: 1, hash: "0x4d5e6f...", position: "right" },
          { level: 2, hash: "0x7a8b9c...", position: "left" },
        ],
      })
      setIsVerifying(false)
    }, 2000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Log Verification</h1>
        <p className="text-gray-400">Verify log integrity against blockchain-anchored Merkle roots</p>
      </div>

      {/* Verification Method Selection */}
      <Card>
        <h2 className="text-xl font-bold text-white mb-4">Verification Method</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setVerificationMethod("file")}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              verificationMethod === "file"
                ? "border-neon-indigo bg-neon-indigo/10"
                : "border-dark-600 hover:border-dark-500"
            }`}
          >
            <div className="text-3xl mb-2">📄</div>
            <h3 className="text-white font-semibold mb-1">Upload Log File</h3>
            <p className="text-sm text-gray-400">Verify an entire log file</p>
          </button>
          <button
            onClick={() => setVerificationMethod("line")}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              verificationMethod === "line"
                ? "border-neon-indigo bg-neon-indigo/10"
                : "border-dark-600 hover:border-dark-500"
            }`}
          >
            <div className="text-3xl mb-2">📝</div>
            <h3 className="text-white font-semibold mb-1">Single Log Entry</h3>
            <p className="text-sm text-gray-400">Verify a specific log line</p>
          </button>
        </div>
      </Card>

      {/* Verification Input */}
      <Card>
        <h2 className="text-xl font-bold text-white mb-4">
          {verificationMethod === "file" ? "Upload Log File" : "Enter Log Entry"}
        </h2>

        {verificationMethod === "file" ? (
          <div className="border-2 border-dashed border-dark-600 rounded-lg p-12 text-center hover:border-neon-indigo/50 transition-colors cursor-pointer">
            <div className="text-5xl mb-4">📤</div>
            <p className="text-white font-medium mb-2">Drop your log file here or click to browse</p>
            <p className="text-sm text-gray-400">Supports .log, .txt files up to 100MB</p>
            <input type="file" className="hidden" accept=".log,.txt" />
          </div>
        ) : (
          <div>
            <textarea
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              placeholder="Paste your log entry here..."
              className="input-field min-h-32 font-mono text-sm resize-none"
            />
          </div>
        )}

        <div className="mt-6">
          <button onClick={handleVerify} disabled={isVerifying} className="btn-primary w-full">
            {isVerifying ? "Verifying..." : "Verify Log"}
          </button>
        </div>
      </Card>

      {/* Verification Progress */}
      {isVerifying && (
        <Card animated>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-neon-indigo border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-xl font-bold text-white mb-2">Verifying...</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>Computing hash...</p>
              <p>Generating Merkle proof...</p>
              <p>Comparing with on-chain root...</p>
            </div>
          </div>
        </Card>
      )}

      {/* Verification Result */}
      {verificationResult && !isVerifying && (
        <Card animated className="animate-pulse-glow">
          <div className="text-center mb-6">
            <div
              className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl ${
                verificationResult.status === "verified"
                  ? "bg-green-500/20 border-2 border-green-500"
                  : "bg-red-500/20 border-2 border-red-500"
              }`}
            >
              {verificationResult.status === "verified" ? "✓" : "✗"}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {verificationResult.status === "verified" ? "Verification Successful" : "Verification Failed"}
            </h2>
            <p className="text-gray-400">
              {verificationResult.status === "verified"
                ? "Log entry matches blockchain-anchored Merkle root"
                : "Log entry does not match any anchored batch"}
            </p>
          </div>

          {verificationResult.status === "verified" && (
            <div className="space-y-6">
              {/* Batch Info */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Matched Batch</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-dark-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Batch ID</p>
                    <p className="text-white font-mono text-sm">{verificationResult.batchId}</p>
                  </div>
                  <div className="bg-dark-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Verified At</p>
                    <p className="text-white font-medium">{new Date(verificationResult.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Merkle Root */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Merkle Root</h3>
                <div className="bg-dark-700/50 p-4 rounded-lg">
                  <p className="text-white font-mono text-sm break-all">{verificationResult.merkleRoot}</p>
                </div>
              </div>

              {/* Proof Steps */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Merkle Proof Chain</h3>
                <div className="space-y-3">
                  {verificationResult.proofSteps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-dark-700/50 p-4 rounded-lg animate-slide-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-neon-indigo/20 border border-neon-indigo rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">Level {step.level}</p>
                        <p className="text-white font-mono text-xs">{step.hash}</p>
                      </div>
                      <Badge status="verified">{step.position}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button onClick={() => setVerificationResult(null)} className="btn-secondary flex-1">
              Verify Another
            </button>
            <button className="btn-primary flex-1">Download Proof</button>
          </div>
        </Card>
      )}
    </div>
  )
}
