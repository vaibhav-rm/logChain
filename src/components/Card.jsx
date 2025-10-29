export default function Card({ children, className = "", animated = false }) {
  return <div className={`glass-card p-6 ${animated ? "animate-slide-up" : ""} ${className}`}>{children}</div>
}
