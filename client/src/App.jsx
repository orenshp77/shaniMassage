import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import InputPage from './pages/InputPage'
import DisplayPage from './pages/DisplayPage'
import QRPage from './pages/QRPage'
import ConnectPage from './pages/ConnectPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import TVPairPage from './pages/TVPairPage'
import PairPage from './pages/PairPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<ConnectPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/display" element={<DisplayPage />} />

          {/* Protected routes - require password login */}
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/input" element={<ProtectedRoute><InputPage /></ProtectedRoute>} />
          <Route path="/qr" element={<ProtectedRoute><QRPage /></ProtectedRoute>} />
          <Route path="/tv" element={<ProtectedRoute><TVPairPage /></ProtectedRoute>} />
          <Route path="/pair" element={<ProtectedRoute><PairPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
