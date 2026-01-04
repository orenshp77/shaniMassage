import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import Swal from 'sweetalert2'
import './QRPage.css'

function QRPage() {
  const [baseUrl, setBaseUrl] = useState('')
  const [workspaceCode, setWorkspaceCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const scannerRef = useRef(null)
  const navigate = useNavigate()

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

    // Get workspace info from localStorage
    const storedWorkspace = localStorage.getItem('workspaceCode')
    const storedName = localStorage.getItem('displayName')

    if (!storedWorkspace) {
      // Redirect to login if no workspace
      navigate('/login')
      return
    }

    setWorkspaceCode(storedWorkspace)
    setDisplayName(storedName || 'מרחב העבודה שלי')
  }, [navigate])

  // Initialize QR Scanner
  useEffect(() => {
    if (showScanner && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        false
      )

      scanner.render(
        (decodedText) => {
          // Success - QR code scanned
          scanner.clear()
          scannerRef.current = null
          setShowScanner(false)

          // Navigate to the scanned URL
          if (decodedText.startsWith('http')) {
            window.location.href = decodedText
          } else {
            Swal.fire({
              icon: 'error',
              title: 'קוד לא תקין',
              text: 'הקוד שנסרק אינו קישור תקין'
            })
          }
        },
        (error) => {
          // Scan error - ignore, keep scanning
        }
      )

      scannerRef.current = scanner
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [showScanner])

  const openScanner = () => {
    setShowScanner(true)
  }

  const closeScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {})
      scannerRef.current = null
    }
    setShowScanner(false)
  }

  // URLs with workspace code
  const inputUrl = `${baseUrl}/?ws=${workspaceCode}&type=input`
  const displayUrl = `${baseUrl}/?ws=${workspaceCode}&type=display`
  const connectUrl = `${baseUrl}/?ws=${workspaceCode}`

  const handleLogout = () => {
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

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="scanner-modal">
          <div className="scanner-container">
            <div className="scanner-header">
              <h2>סרוק QR מהטלוויזיה</h2>
              <button className="close-scanner" onClick={closeScanner}>✕</button>
            </div>
            <div id="qr-reader"></div>
            <p className="scanner-hint">כוון את המצלמה על קוד ה-QR בטלוויזיה</p>
          </div>
        </div>
      )}

      <div className="qr-container">
        {/* TV Connect Button */}
        <button className="tv-connect-btn" onClick={openScanner}>
          <span className="tv-icon">📺</span>
          <span className="tv-text">חבר טלוויזיה</span>
        </button>

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
            <h2>עמוד ניהול</h2>
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
              <button className="card-btn copy-btn" onClick={() => copyToClipboard(inputUrl, 'קישור לעמוד ניהול')}>
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
