import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { pairTvWithWorkspace } from '../services/firebase'
import Swal from 'sweetalert2'
import './PairPage.css'

function PairPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [pairingCode, setPairingCode] = useState('')
  const [status, setStatus] = useState('checking') // checking, needLogin, ready, pairing, success, error
  const [workspaceCode, setWorkspaceCode] = useState('')
  const [displayName, setDisplayName] = useState('')

  // QR Scanner state
  const [scannerOpen, setScannerOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [maxZoom, setMaxZoom] = useState(1)
  const [zoomSupported, setZoomSupported] = useState(false)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)
  const videoTrackRef = useRef(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setPairingCode(code)
    }

    // Check if user has workspace code (from login OR from 3-digit code entry)
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    const storedWorkspace = user?.workspace_code || localStorage.getItem('workspaceCode')
    const storedName = user?.display_name || localStorage.getItem('displayName')

    if (storedWorkspace) {
      setWorkspaceCode(storedWorkspace)
      setDisplayName(storedName || 'מרחב העבודה שלי')
      setStatus('ready')
    } else {
      // No workspace at all - need to login or enter code
      setStatus('needLogin')
    }
  }, [searchParams])

  const handlePair = async () => {
    if (!workspaceCode) return

    if (!pairingCode) {
      Swal.fire({
        icon: 'info',
        title: 'סרוק את קוד ה-QR',
        html: `
          <p>כדי לחבר טלוויזיה, יש לסרוק את קוד ה-QR שמוצג על מסך הטלוויזיה</p>
          <p style="margin-top: 15px; font-size: 0.9em; color: #666;">
            פתח את אפליקציית המצלמה בטלפון וכוון אותה לקוד ה-QR
          </p>
        `,
        showCancelButton: true,
        confirmButtonText: '📺 עבור למסך הטלוויזיה',
        cancelButtonText: 'סגור',
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#999'
      }).then((result) => {
        if (result.isConfirmed) {
          // Go to ConnectPage where TV shows QR
          navigate('/')
        }
      })
      return
    }

    setStatus('pairing')

    try {
      const result = await pairTvWithWorkspace(pairingCode, workspaceCode)

      setStatus('success')
      Swal.fire({
        icon: 'success',
        title: 'הטלוויזיה מחוברת!',
        text: result.message,
        showConfirmButton: false,
        timer: 2000
      }).then(() => {
        // Phone goes to Input page to manage messages
        navigate(`/input/${workspaceCode}`)
      })
    } catch (error) {
      setStatus('error')
      Swal.fire({
        icon: 'error',
        title: 'שגיאה',
        text: error.message || 'לא ניתן לצמד את הטלוויזיה'
      })
    }
  }

  const goToLogin = () => {
    // Save the pairing code so we can return after login
    if (pairingCode) {
      sessionStorage.setItem('pendingPairingCode', pairingCode)
    }
    navigate('/login')
  }

  const goToRegister = () => {
    // Save the pairing code so we can return after registration
    if (pairingCode) {
      sessionStorage.setItem('pendingPairingCode', pairingCode)
    }
    navigate('/register')
  }

  // Apply zoom to camera
  const applyZoom = async (newZoom) => {
    if (videoTrackRef.current && zoomSupported) {
      try {
        await videoTrackRef.current.applyConstraints({
          advanced: [{ zoom: newZoom }]
        })
        setZoomLevel(newZoom)
      } catch (err) {
        console.error("Error applying zoom:", err)
      }
    }
  }

  // Open QR scanner
  const openScanner = () => {
    setScannerOpen(true)
  }

  // Close scanner
  const closeScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current = null
        videoTrackRef.current = null
      }).catch(err => console.error("Error stopping scanner:", err))
    }
    setScannerOpen(false)
  }

  // Start QR scanner when modal opens
  useEffect(() => {
    if (scannerOpen && scannerRef.current && !html5QrCodeRef.current) {
      const html5QrCode = new Html5Qrcode("pair-qr-reader")
      html5QrCodeRef.current = html5QrCode

      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          disableFlip: false
        },
        (decodedText) => {
          console.log("QR Scanned:", decodedText)

          html5QrCode.stop().then(() => {
            html5QrCodeRef.current = null
            videoTrackRef.current = null
          }).catch(err => console.error("Error stopping scanner:", err))

          setScannerOpen(false)

          // Extract pairing code from URL or use as-is
          try {
            const url = new URL(decodedText)
            const code = url.searchParams.get('code')
            if (code) {
              setPairingCode(code)
              // Auto-pair immediately
              setTimeout(() => handlePairWithCode(code), 100)
            }
          } catch (e) {
            // Not a URL - check if it's just a pairing code
            if (/^\d{3}$/.test(decodedText)) {
              setPairingCode(decodedText)
              setTimeout(() => handlePairWithCode(decodedText), 100)
            } else {
              Swal.fire({
                icon: 'warning',
                title: 'קוד לא מזוהה',
                text: 'זה לא נראה כמו קוד צימוד. נסו לסרוק שוב.',
                confirmButtonText: 'אוקי',
                confirmButtonColor: '#00bcd4',
                background: '#0c0c1e',
                color: '#fff'
              })
            }
          }
        },
        () => {}
      ).then(() => {
        setTimeout(() => {
          const videoElement = document.querySelector('#pair-qr-reader video')
          if (videoElement && videoElement.srcObject) {
            const track = videoElement.srcObject.getVideoTracks()[0]
            if (track) {
              videoTrackRef.current = track
              const capabilities = track.getCapabilities()
              if (capabilities.zoom) {
                setZoomSupported(true)
                setMaxZoom(capabilities.zoom.max || 5)
                setZoomLevel(capabilities.zoom.min || 1)
              } else {
                setZoomSupported(false)
              }
            }
          }
        }, 500)
      }).catch(err => {
        console.error("Error starting scanner:", err)
        setScannerOpen(false)
        Swal.fire({
          icon: 'error',
          title: 'שגיאה',
          html: `<div style="direction: rtl;"><p>לא ניתן לפתוח את המצלמה</p></div>`,
          confirmButtonText: 'אוקי',
          confirmButtonColor: '#00bcd4',
          background: '#0c0c1e',
          color: '#fff'
        })
      })
    }

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current = null
          videoTrackRef.current = null
        }).catch(err => console.error("Error stopping scanner:", err))
      }
      setZoomLevel(1)
      setZoomSupported(false)
    }
  }, [scannerOpen])

  // Pair with a specific code
  const handlePairWithCode = async (code) => {
    if (!workspaceCode || !code) return

    setStatus('pairing')

    try {
      const result = await pairTvWithWorkspace(code, workspaceCode)

      setStatus('success')
      Swal.fire({
        icon: 'success',
        title: 'הטלוויזיה מחוברת!',
        text: result.message,
        showConfirmButton: false,
        timer: 2000
      }).then(() => {
        navigate(`/input/${workspaceCode}`)
      })
    } catch (error) {
      setStatus('error')
      Swal.fire({
        icon: 'error',
        title: 'שגיאה',
        text: error.message || 'לא ניתן לצמד את הטלוויזיה'
      })
    }
  }

  return (
    <div className="pair-page">
      <div className="pair-bg">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="floating-shape"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="pair-container">
        <div className="pair-card">
          <div className="pair-icon">📺</div>
          <h1>חיבור טלוויזיה</h1>

          {status === 'checking' && (
            <p className="status-text">בודק...</p>
          )}

          {status === 'needLogin' && (
            <>
              <p className="pair-message">
                כדי לחבר את הטלוויזיה, יש להתחבר קודם לחשבון שלך
              </p>
              <button className="pair-btn primary" onClick={goToLogin}>
                התחבר לחשבון
              </button>
              <button className="pair-btn secondary" onClick={goToRegister}>
                יצירת חשבון חדש
              </button>
            </>
          )}

          {status === 'ready' && (
            <>
              <p className="pair-message">
                לחץ כדי לחבר את הטלוויזיה ל:
              </p>
              <div className="workspace-info">
                <span className="workspace-name">{displayName}</span>
                <span className="workspace-code-small">{workspaceCode}</span>
              </div>
              <button className="pair-btn primary large" onClick={pairingCode ? handlePair : openScanner}>
                {pairingCode ? 'חבר את הטלוויזיה' : '📷 סרוק קוד QR לחיבור'}
              </button>
              <button className="pair-btn secondary" onClick={() => navigate('/qr')}>
                ביטול
              </button>
            </>
          )}

          {status === 'pairing' && (
            <div className="pairing-spinner">
              <div className="spinner"></div>
              <p>מחבר את הטלוויזיה...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="success-state">
              <div className="success-icon">✓</div>
              <p>הטלוויזיה מחוברת!</p>
            </div>
          )}

          {status === 'error' && (
            <>
              <p className="error-text">אירעה שגיאה בחיבור</p>
              <button className="pair-btn primary" onClick={handlePair}>
                נסה שוב
              </button>
              <button className="pair-btn secondary" onClick={() => navigate('/qr')}>
                חזור
              </button>
            </>
          )}

          {pairingCode && (
            <div className="pairing-code-display">
              קוד צימוד: <strong>{pairingCode}</strong>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {scannerOpen && (
        <div className="qr-scanner-modal">
          <div className="qr-scanner-container">
            <button className="close-scanner" onClick={closeScanner}>✕</button>
            <h3>סרקו את קוד ה-QR</h3>
            <p>כוונו את המצלמה לקוד שעל מסך הטלוויזיה</p>
            <div id="pair-qr-reader" ref={scannerRef}></div>

            {/* Zoom Control */}
            {zoomSupported && (
              <div className="zoom-control">
                <span className="zoom-icon">🔍</span>
                <button
                  className="zoom-btn"
                  onClick={() => applyZoom(Math.max(1, zoomLevel - 0.5))}
                  disabled={zoomLevel <= 1}
                >
                  −
                </button>
                <input
                  type="range"
                  min="1"
                  max={maxZoom}
                  step="0.1"
                  value={zoomLevel}
                  onChange={(e) => applyZoom(parseFloat(e.target.value))}
                  className="zoom-slider"
                />
                <button
                  className="zoom-btn"
                  onClick={() => applyZoom(Math.min(maxZoom, zoomLevel + 0.5))}
                  disabled={zoomLevel >= maxZoom}
                >
                  +
                </button>
                <span className="zoom-level">{zoomLevel.toFixed(1)}x</span>
              </div>
            )}

            <div className="scanner-tip">
              <span>💡</span> {zoomSupported ? 'השתמשו בזום כדי להתקרב לקוד' : 'קרבו את הטלפון לקוד עד שהוא ממלא את המסגרת'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PairPage
