import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"
import Devices from "./pages/Devices"
import Logs from "./pages/Logs"
import Verification from "./pages/Verification"
import Activity from "./pages/Activity"
import Settings from "./pages/Settings"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
