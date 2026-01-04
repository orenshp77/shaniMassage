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
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const storedWorkspace = wsFromUrl || user.workspace_code || localStorage.getItem('workspaceCode')
    const storedName = user.display_name || localStorage.getItem('displayName')

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
  }, [navigate, urlWorkspaceCode])

  // Go to pair page to connect TV
  const goToConnect = () => {
    navigate('/pair')
  }

  // URLs with workspace code in path
  const inputUrl = `${baseUrl}/input/${workspaceCode}`
  const displayUrl = `${baseUrl}/display/${workspaceCode}`
  const connectUrl = `${baseUrl}/?ws=${workspaceCode}`

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
            <div className="url-hint">דורש PIN למסך</div>
            <div className="card-actions">
              <button className="card-btn enter-btn" onClick={() => window.open(displayUrl, '_blank')}>
                כניסה
              </button>
              <button className="card-btn copy-btn" onClick={() => copyToClipboard(displayUrl, 'קישור למסך תצוגה')}>
                העתק קישור
              </button>
            </div>
          </div>

          {/* Input Page QR */}
          <div className="qr-card input-card">
            <div className="qr-icon">📝</div>
            <h2>עמוד יצירת הודעות</h2>
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
            <div className="url-hint">דורש PIN לניהול</div>
            <div className="card-actions">
              <button className="card-btn enter-btn" onClick={() => window.open(inputUrl, '_blank')}>
                כניסה
              </button>
              <button className="card-btn copy-btn" onClick={() => copyToClipboard(inputUrl, 'קישור לעמוד יצירת הודעות')}>
                העתק קישור
              </button>
            </div>
          </div>

          {/* General Connect QR */}
          <div className="qr-card connect-card">
            <div className="qr-icon">🔗</div>
            <h2>התחברות כללית</h2>
            <p>סרוק לבחירת סוג גישה</p>
            <div className="qr-code-wrapper">
              <QRCodeSVG
                value={connectUrl}
                size={200}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#667eea"
              />
            </div>
            <div className="url-hint">בחירת ניהול/תצוגה</div>
            <div className="card-actions">
              <button className="card-btn enter-btn" onClick={() => window.open(connectUrl, '_blank')}>
                כניסה
              </button>
              <button className="card-btn copy-btn" onClick={() => copyToClipboard(connectUrl, 'קישור להתחברות כללית')}>
                העתק קישור
              </button>
            </div>
          </div>
        </div>

        {/* TV Connect Button - below QR cards */}
        <button className="tv-connect-btn" onClick={goToConnect}>
          <span className="tv-icon">📺</span>
          <span className="tv-text">חבר מסך</span>
        </button>

        <div className="qr-instructions">
          <h3>איך זה עובד?</h3>
          <ol>
            <li>📱 פתח את המצלמה בטלפון</li>
            <li>🎯 כוון על הקוד הרצוי</li>
            <li>🔗 לחץ על הקישור שמופיע</li>
            <li>🔢 הזן את קוד ה-PIN המתאים</li>
            <li>✨ זהו! אתה מחובר</li>
          </ol>
        </div>

        <div className="qr-actions">
          <button onClick={() => navigate('/input')} className="action-btn input-action">
            עבור לניהול הודעות
          </button>
          <button onClick={handleLogout} className="action-btn logout-action">
            התנתק
          </button>
        </div>
      </div>
    </div>
  )
}

export default QRPage
