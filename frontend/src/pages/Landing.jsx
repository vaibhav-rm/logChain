import { Link } from "react-router-dom"

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Navigation */}
      <nav className="glass-card border-b border-dark-600/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg"></div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">LogChain</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/signup" className="btn-primary">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl animate-pulse-glow"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-primary bg-clip-text text-transparent">Tamper-Proof</span>
              <br />
              Server Logs
            </h1>
            <p className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Secure your logs with blockchain-anchored Merkle roots. Detect tampering instantly with cryptographic
              verification.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="btn-primary text-lg px-8 py-4">
                Get Started Free
              </Link>
              <button className="btn-secondary text-lg px-8 py-4">Download Agent</button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Privacy First",
              description: "Raw logs never leave your device. Only cryptographic hashes are sent to the cloud.",
              icon: "🔒",
            },
            {
              title: "Blockchain Anchored",
              description: "Merkle roots anchored on-chain provide immutable proof of log integrity.",
              icon: "⛓️",
            },
            {
              title: "Real-Time Verification",
              description: "Instantly verify log authenticity and detect any tampering attempts.",
              icon: "⚡",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="glass-card p-8 animate-slide-up hover:scale-105 transition-transform duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-primary bg-clip-text text-transparent">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: "1", title: "Install Agent", desc: "Deploy lightweight client on your servers" },
            { step: "2", title: "Hash Locally", desc: "Logs are hashed and organized into Merkle trees" },
            { step: "3", title: "Anchor On-Chain", desc: "Merkle roots are anchored to blockchain" },
            { step: "4", title: "Verify Anytime", desc: "Cryptographically verify log integrity" },
          ].map((item, index) => (
            <div key={index} className="text-center animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center text-2xl font-bold">
                {item.step}
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="glass-card p-12 text-center animate-pulse-glow">
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Secure Your Logs?</h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join organizations worldwide using LogChain for tamper-proof log management.
          </p>
          <Link to="/signup" className="btn-primary text-lg px-8 py-4 inline-block">
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-600/50 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 LogChain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
