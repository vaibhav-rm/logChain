import { Outlet, NavLink } from "react-router-dom"

export default function Layout() {
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/devices", label: "My Devices", icon: "💻" },
    { path: "/logs", label: "Logs", icon: "📝" },
    { path: "/verification", label: "Verification", icon: "✓" },
    { path: "/activity", label: "Activity", icon: "📋" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ]

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="glass-card border-b border-dark-600/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg"></div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">LogChain</span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive ? "bg-dark-700 text-white" : "text-gray-400 hover:text-white hover:bg-dark-700/50"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <button className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Logout</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
