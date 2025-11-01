"use client"

import { useState, useRef } from "react"
import { FileText, PenLine, Upload, CheckCircle2, XCircle } from "lucide-react"
import Card from "../components/Card"
import Badge from "../components/Badge"

export default function Verification() {
  const [verificationMethod, setVerificationMethod] = useState("file")
  const [logInput, setLogInput] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setLogInput("") // Clear text input when file is selected
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.log') || file.name.endsWith('.txt'))) {
      setSelectedFile(file)
      setLogInput("") // Clear text input when file is selected
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleFileInputClick = () => {
    fileInputRef.current?.click()
  }

  const handleVerify = async () => {
    if (verificationMethod === "file" && !selectedFile) {
      alert("Please select a file to verify")
      return
    }
    if (verificationMethod === "line" && !logInput.trim()) {
      alert("Please enter a log entry to verify")
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      let logContent = ""
      
      if (verificationMethod === "file" && selectedFile) {
        // Read file content
        logContent = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.onerror = reject
          reader.readAsText(selectedFile)
        })
      } else if (verificationMethod === "line") {
        logContent = logInput
      }

      // Here you would typically send the log content to your backend API
      // For now, we'll simulate the verification
      // TODO: Integrate with actual verification API endpoint
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate verification result
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
    } catch (error) {
      console.error("Verification error:", error)
      setVerificationResult({
        status: "failed",
        error: error.message || "Failed to verify log"
      })
    } finally {
      setIsVerifying(false)
    }
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
            onClick={() => {
              setVerificationMethod("file")
              setLogInput("") // Clear text input when switching to file mode
            }}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              verificationMethod === "file"
                ? "border-neon-indigo bg-neon-indigo/10"
                : "border-dark-600 hover:border-dark-500"
            }`}
          >
            <div className="text-3xl mb-2"><FileText className="w-7 h-7" /></div>
            <h3 className="text-white font-semibold mb-1">Upload Log File</h3>
            <p className="text-sm text-gray-400">Verify an entire log file</p>
          </button>
          <button
            onClick={() => {
              setVerificationMethod("line")
              setSelectedFile(null) // Clear file when switching to line mode
              if (fileInputRef.current) {
                fileInputRef.current.value = ""
              }
            }}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              verificationMethod === "line"
                ? "border-neon-indigo bg-neon-indigo/10"
                : "border-dark-600 hover:border-dark-500"
            }`}
          >
            <div className="text-3xl mb-2"><PenLine className="w-7 h-7" /></div>
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
          <div 
            onClick={handleFileInputClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-dark-600 rounded-lg p-12 text-center hover:border-neon-indigo/50 transition-colors cursor-pointer relative"
          >
            <div className="text-5xl mb-4"><Upload className="w-10 h-10 inline" /></div>
            {selectedFile ? (
              <>
                <p className="text-white font-medium mb-2">Selected: {selectedFile.name}</p>
                <p className="text-sm text-gray-400 mb-2">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                  }}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Remove file
                </button>
              </>
            ) : (
              <>
                <p className="text-white font-medium mb-2">Drop your log file here or click to browse</p>
                <p className="text-sm text-gray-400">Supports .log, .txt files up to 100MB</p>
              </>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".log,.txt" 
              onChange={handleFileSelect}
            />
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
          <button 
            onClick={handleVerify} 
            disabled={isVerifying || (verificationMethod === "file" && !selectedFile) || (verificationMethod === "line" && !logInput.trim())} 
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
              className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                verificationResult.status === "verified"
                  ? "bg-green-500/20 border-2 border-green-500"
                  : "bg-red-500/20 border-2 border-red-500"
              }`}
            >
              {verificationResult.status === "verified" ? (
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              ) : (
                <XCircle className="w-10 h-10 text-red-400" />
              )}
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
            <button 
              onClick={() => {
                setVerificationResult(null)
                setSelectedFile(null)
                setLogInput("")
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
              }} 
              className="btn-secondary flex-1"
            >
              Verify Another
            </button>
            <button 
              onClick={() => {
                if (!verificationResult) return
                
                // Create proof data object
                const proofData = {
                  status: verificationResult.status,
                  verifiedAt: verificationResult.timestamp,
                  merkleRoot: verificationResult.merkleRoot,
                  batchId: verificationResult.batchId,
                  proofSteps: verificationResult.proofSteps || [],
                  verificationMethod: verificationMethod,
                  logSource: verificationMethod === "file" 
                    ? (selectedFile ? selectedFile.name : "unknown")
                    : "manual_entry",
                }
                
                // Create and download JSON file
                const dataStr = JSON.stringify(proofData, null, 2)
                const dataBlob = new Blob([dataStr], { type: 'application/json' })
                const url = URL.createObjectURL(dataBlob)
                const link = document.createElement('a')
                link.href = url
                link.download = `verification-proof-${verificationResult.batchId || Date.now()}.json`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
              }}
              className="btn-primary flex-1"
            >
              Download Proof
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
