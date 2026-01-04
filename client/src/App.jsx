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

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<ConnectPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/input" element={<InputPage />} />
          <Route path="/display" element={<DisplayPage />} />
          <Route path="/qr" element={<QRPage />} />
          <Route path="/tv" element={<TVPairPage />} />
          <Route path="/pair" element={<PairPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
