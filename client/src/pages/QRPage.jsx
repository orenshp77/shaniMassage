import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Swal from 'sweetalert2'
import api from '../services/api'
import './QRPage.css'

function QRPage() {
  const [baseUrl, setBaseUrl] = useState('')
  const [workspaceCode, setWorkspaceCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [tvConnected, setTvConnected] = useState(false)
  const navigate = useNavigate()
  const { workspaceCode: urlWorkspaceCode } = useParams()

  const copyToClipboard = async (url, label) => {
    try {
      await navigator.clipboard.writeText(url)
      Swal.fire({
        icon: 'success',
        title: 'הקישור הועתק!',
        text: `${label}`,
        showConfirmButton: false,
        timer: 1500
      })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'שגיאה',
        text: 'לא ניתן להעתיק את הקישור'
      })
    }
  }

  useEffect(() => {
    // Get the current base URL automatically
    const url = window.location.origin
    setBaseUrl(url)

    // Get workspace from URL first, then from localStorage
    const wsFromUrl = urlWorkspaceCode
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    const storedWorkspace = wsFromUrl || user?.workspace_code || localStorage.getItem('workspaceCode')
    const storedName = user?.display_name || localStorage.getItem('displayName')

    if (!storedWorkspace) {
      navigate('/')
      return
    }

    // Save to localStorage for future use
    if (wsFromUrl) {
      localStorage.setItem('workspaceCode', wsFromUrl)
    }

    setWorkspaceCode(storedWorkspace)
    setDisplayName(storedName || 'מרחב העבודה שלי')

    // Check TV connection status
    const checkTvStatus = async () => {
      try {
        const response = await api.get(`/tv/status?workspace=${storedWorkspace}`)
        setTvConnected(response.data.connected)
      } catch (error) {
        console.error('Error checking TV status:', error)
      }
    }
    checkTvStatus()

    // Poll TV status every 5 seconds
    const interval = setInterval(checkTvStatus, 5000)
    return () => clearInterval(interval)
  }, [navigate, urlWorkspaceCode])

  // Go to pair page to connect TV
  const goToConnect = () => {
    navigate('/pair')
  }

  // URLs with workspace code in path
  const inputUrl = `${baseUrl}/input/${workspaceCode}`
  const displayUrl = `${baseUrl}/display/${workspaceCode}`

  const handleLogout = async () => {
    // Notify server to disconnect TV
    try {
      await api.post('/tv/disconnect', { workspaceCode })
    } catch (e) {}
    localStorage.removeItem('workspaceCode')
    localStorage.removeItem('displayName')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <div className="qr-page">
      {/* Animated background */}
      <div className="qr-bg">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="floating-shape"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="qr-container">
        <header className="qr-header">
          <h1>{displayName}</h1>
          <p className="workspace-code-display">קוד עבודה: <strong>{workspaceCode}</strong></p>
          <p>סרוק את הקוד כדי להתחבר</p>
        </header>

        <div className="qr-cards">
          {/* Display Page QR */}
          <div className="qr-card display-card">
            <div className="qr-icon">📺</div>
            <h2>מסך תצוגה</h2>
            <p>סרוק להצגה על טלוויזיה</p>
            <div className="qr-code-wrapper">
              <QRCodeSVG
                value={displayUrl}
                size={200}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#00bcd4"
              />
            </div>
            <div className="card-actions">
              <button className="card-btn enter-btn" onClick={() => navigate(`/display/${workspaceCode}`)}>
                כניסה
              </button>
              <button className="card-btn copy-btn" onClick={() => copyToClipboard(displayUrl, 'קישור למסך תצוגה')}>
                העתק קישור
              </button>
            </div>
          </div>

          {/* Input Page QR - accessible with workspace code */}
          <div className="qr-card input-card">
            <div className="qr-icon">📝</div>
            <h2>ניהול הודעות</h2>
            <p>סרוק כדי להזין ולנהל הודעות</p>
            <div className="qr-code-wrapper">
              <QRCodeSVG
                value={inputUrl}
                size={200}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#ff69b4"
              />
            </div>
            <div className="card-actions">
              <button className="card-btn enter-btn" onClick={() => navigate(`/input/${workspaceCode}`)}>
                כניסה
              </button>
              <button className="card-btn copy-btn" onClick={() => copyToClipboard(inputUrl, 'קישור לניהול הודעות')}>
                העתק קישור
              </button>
            </div>
          </div>
        </div>

        {/* TV Connect Button - below QR cards */}
        {tvConnected ? (
          <div className="tv-status-btn connected">
            <span className="tv-icon">📺</span>
            <span className="tv-text">מסך מחובר</span>
          </div>
        ) : (
          <button className="tv-connect-btn" onClick={goToConnect}>
            <span className="tv-icon">📺</span>
            <span className="tv-text">חבר טלוויזיה</span>
          </button>
        )}

        <div className="qr-actions">
          <button onClick={handleLogout} className="action-btn logout-action">
            התנתק
          </button>
        </div>
      </div>
    </div>
  )
}

export default QRPage
