export default function Badge({ status, children }) {
  const statusClasses = {
    online: "status-online",
    offline: "status-offline",
    verified: "status-verified",
    error: "status-error",
  }

  return <span className={statusClasses[status] || "status-badge bg-gray-500/20 text-gray-400"}>{children}</span>
}
