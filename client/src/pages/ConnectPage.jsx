import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'
import Swal from 'sweetalert2'
import api from '../services/api'
import './ConnectPage.css'

function ConnectPage() {
  // Phone/Connect side state - only workspace code needed
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  // TV side state
  const [pairingCode, setPairingCode] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [tvStatus, setTvStatus] = useState('waiting')

  // Menu and accessibility state
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)
  const [fontSize, setFontSize] = useState(100)
  const [highContrast, setHighContrast] = useState(false)
  const [linkHighlight, setLinkHighlight] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [scannerOpen, setScannerOpen] = useState(false)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  // Scroll handler for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Apply accessibility settings
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`
    if (highContrast) {
      document.body.classList.add('high-contrast')
    } else {
      document.body.classList.remove('high-contrast')
    }
    if (linkHighlight) {
      document.body.classList.add('link-highlight')
    } else {
      document.body.classList.remove('link-highlight')
    }
  }, [fontSize, highContrast, linkHighlight])

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 10, 150))
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 10, 80))
  const resetAccessibility = () => {
    setFontSize(100)
    setHighContrast(false)
    setLinkHighlight(false)
  }

  // Show connection instructions popup
  const showConnectionInstructions = (e) => {
    e.preventDefault()
    setMenuOpen(false)

    Swal.fire({
      html: `
        <div style="text-align: center; direction: rtl;">
          <div style="margin-bottom: 20px;">
            <svg width="120" height="100" viewBox="0 0 120 100" style="margin: 0 auto;">
              <!-- TV Screen -->
              <rect x="30" y="10" width="60" height="45" rx="3" fill="#1a1a2e" stroke="#00ffff" stroke-width="2"/>
              <rect x="35" y="15" width="50" height="35" fill="#0a0a1a"/>
              <text x="60" y="37" text-anchor="middle" fill="#00ffff" font-size="8">aabb.co.il</text>
              <!-- TV Stand -->
              <rect x="50" y="55" width="20" height="5" fill="#333"/>
              <rect x="40" y="60" width="40" height="3" rx="1" fill="#333"/>
              <!-- Left Hand with Remote -->
              <g class="hand-left" style="animation: pointLeft 1.5s ease-in-out infinite;">
                <ellipse cx="15" cy="50" rx="8" ry="10" fill="#ffdbac"/>
                <rect x="10" y="35" width="10" height="20" rx="2" fill="#333"/>
                <circle cx="15" cy="40" r="2" fill="#ff0000"/>
                <!-- Signal waves -->
                <path d="M25 45 Q35 40 45 45" stroke="#00ffff" stroke-width="1" fill="none" opacity="0.6"/>
                <path d="M25 50 Q35 45 45 50" stroke="#00ffff" stroke-width="1" fill="none" opacity="0.4"/>
              </g>
              <!-- Right Hand with Phone -->
              <g class="hand-right" style="animation: pointRight 1.5s ease-in-out infinite 0.5s;">
                <ellipse cx="105" cy="50" rx="8" ry="10" fill="#ffdbac"/>
                <rect x="95" y="35" width="15" height="25" rx="2" fill="#333"/>
                <rect x="97" y="37" width="11" height="18" fill="#1a1a2e"/>
                <circle cx="102" cy="58" r="1.5" fill="#666"/>
              </g>
            </svg>
          </div>

          <style>
            @keyframes pointLeft {
              0%, 100% { transform: translateX(0); }
              50% { transform: translateX(5px); }
            }
            @keyframes pointRight {
              0%, 100% { transform: translateX(0); }
              50% { transform: translateX(-5px); }
            }
          </style>

          <div style="background: linear-gradient(135deg, #1a1a2e, #2a2a4e); padding: 20px; border-radius: 15px; margin: 15px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 15px; text-align: right;">
              <span style="background: #00ffff; color: #1a1a2e; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-left: 10px; flex-shrink: 0;">1</span>
              <span style="color: white; font-size: 16px;">כנסו לדפדפן במסך הטלוויזיה ורשמו<br><strong style="color: #00ffff; font-size: 18px;">aabb.co.il</strong></span>
            </div>

            <div style="display: flex; align-items: center; text-align: right;">
              <span style="background: #ff69b4; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-left: 10px; flex-shrink: 0;">2</span>
              <span style="color: white; font-size: 16px;">פתחו את מצלמת הטלפון וכוונו לסורק<br><strong style="color: #ff69b4;">התחברו למסך</strong></span>
            </div>
          </div>
        </div>
      `,
      confirmButtonText: 'הבנתי',
      confirmButtonColor: '#00bcd4',
      background: '#0c0c1e',
      color: '#fff',
      width: '400px',
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Try to open camera for QR scanning
        openCameraForScanning()
      }
    })
  }

  // Open QR scanner
  const openCameraForScanning = () => {
    setScannerOpen(true)
  }

  // Start QR scanner when modal opens
  useEffect(() => {
    if (scannerOpen && scannerRef.current && !html5QrCodeRef.current) {
      const html5QrCode = new Html5Qrcode("qr-reader")
      html5QrCodeRef.current = html5QrCode

      html5QrCode.start(
        { facingMode: "environment" }, // Back camera
        {
          fps: 15,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          disableFlip: false
        },
        (decodedText) => {
          // Successfully scanned
          console.log("QR Scanned:", decodedText)

          // Stop scanner
          html5QrCode.stop().then(() => {
            html5QrCodeRef.current = null
          }).catch(err => console.error("Error stopping scanner:", err))

          setScannerOpen(false)

          // Check if it's a valid pairing URL
          try {
            const url = new URL(decodedText)
            const pairCode = url.searchParams.get('code')

            if (pairCode) {
              // Navigate to pair page with the code
              navigate(`/pair?code=${pairCode}`)
            } else if (url.pathname.includes('/pair')) {
              // Direct pair URL
              navigate(url.pathname + url.search)
            } else {
              // Unknown URL - show error
              Swal.fire({
                icon: 'warning',
                title: 'קוד לא מזוהה',
                text: 'זה לא נראה כמו קוד חיבור. נסו לסרוק שוב.',
                confirmButtonText: 'אוקי',
                confirmButtonColor: '#00bcd4',
                background: '#0c0c1e',
                color: '#fff'
              })
            }
          } catch (e) {
            // Not a URL - check if it's just a pairing code
            if (/^\d{3}$/.test(decodedText)) {
              navigate(`/pair?code=${decodedText}`)
            } else {
              Swal.fire({
                icon: 'warning',
                title: 'קוד לא מזוהה',
                text: 'זה לא נראה כמו קוד חיבור. נסו לסרוק שוב.',
                confirmButtonText: 'אוקי',
                confirmButtonColor: '#00bcd4',
                background: '#0c0c1e',
                color: '#fff'
              })
            }
          }
        },
        (errorMessage) => {
          // QR scan error - ignore, keep scanning
        }
      ).catch(err => {
        console.error("Error starting scanner:", err)
        setScannerOpen(false)
        Swal.fire({
          icon: 'error',
          title: 'שגיאה',
          html: `
            <div style="direction: rtl; text-align: center;">
              <p>לא ניתן לפתוח את המצלמה</p>
              <p>אנא אשרו גישה למצלמה ונסו שוב</p>
            </div>
          `,
          confirmButtonText: 'אוקי',
          confirmButtonColor: '#00bcd4',
          background: '#0c0c1e',
          color: '#fff'
        })
      })
    }

    // Cleanup when modal closes
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current = null
        }).catch(err => console.error("Error stopping scanner:", err))
      }
    }
  }, [scannerOpen, navigate])

  // Close scanner
  const closeScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current = null
      }).catch(err => console.error("Error stopping scanner:", err))
    }
    setScannerOpen(false)
  }

  // Initialize - generate pairing code only once
  useEffect(() => {
    const url = window.location.origin
    setBaseUrl(url)
    generatePairingCode()
  }, [])

  // Check for workspace code in URL (from QR scan)
  useEffect(() => {
    const wsCode = searchParams.get('ws')
    if (wsCode) {
      fetchWorkspace(wsCode)
    }
  }, [searchParams])

  // Generate TV pairing code
  const generatePairingCode = async () => {
    try {
      const response = await api.post('/tv/generate-code')
      setPairingCode(response.data.pairingCode)
      setTvStatus('waiting')
    } catch (error) {
      console.error('Error generating pairing code:', error)
      setTvStatus('error')
    }
  }

  // Poll for TV pairing status
  const checkPairingStatus = useCallback(async () => {
    if (!pairingCode || tvStatus !== 'waiting') return

    try {
      const response = await api.get(`/tv/check-pairing/${pairingCode}`)
      if (response.data.paired) {
        setTvStatus('paired')

        // Store workspace info
        localStorage.setItem('workspaceCode', response.data.workspaceCode)
        localStorage.setItem('displayName', response.data.displayName)
        localStorage.setItem('tvMode', 'true')

        // Navigate to display page after short delay
        setTimeout(() => {
          navigate('/display')
        }, 2000)

        // Generate new pairing code for next connection
        setTimeout(() => {
          setTvStatus('waiting')
          generatePairingCode()
        }, 3000)
      }
    } catch (error) {
      // Pairing not found yet, continue polling
    }
  }, [pairingCode, tvStatus, navigate])

  useEffect(() => {
    const interval = setInterval(checkPairingStatus, 2000)
    return () => clearInterval(interval)
  }, [checkPairingStatus])

  // Phone side - fetch workspace and go directly to QR page
  const fetchWorkspace = async (wsCode) => {
    try {
      const response = await api.get(`/auth/workspace/${wsCode}`)
      const ws = response.data.workspace

      // Go directly to QR page (no PIN needed)
      localStorage.setItem('workspaceCode', ws.workspace_code)
      localStorage.setItem('displayName', ws.display_name)
      navigate('/qr')
    } catch (error) {
      // Show ALERT for wrong code
      Swal.fire({
        icon: 'error',
        title: 'קוד שגוי',
        text: 'קוד העבודה לא נמצא במערכת',
        confirmButtonText: 'נסה שוב',
        confirmButtonColor: '#00bcd4'
      })
      setCode('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length === 3) {
      await fetchWorkspace(code)
    }
  }

  const handleKeyPress = (char) => {
    if (code.length < 3) {
      setCode(prev => prev + char)
    }
  }

  const handleClear = () => {
    setCode('')
    setError('')
  }

  const handleBackspace = () => {
    setCode(prev => prev.slice(0, -1))
  }

  // QR URL for phone to scan
  const pairUrl = `${baseUrl}/pair?code=${pairingCode}`

  return (
    <div className="home-page">
      {/* Accessibility Widget */}
      <div className="accessibility-widget">
        <button
          className="accessibility-toggle"
          onClick={() => setAccessibilityOpen(!accessibilityOpen)}
          aria-label="פתח תפריט נגישות"
          title="נגישות"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="accessibility-icon">
            <circle cx="12" cy="4" r="2.5" fill="currentColor"/>
            <path d="M12 8C12 8 8 9 5 9.5C4.5 9.6 4 10.1 4 10.7C4 11.4 4.6 12 5.3 12C5.4 12 5.5 12 5.6 12L10 11V14L7.5 20.5C7.2 21.2 7.5 22 8.2 22.3C8.9 22.6 9.7 22.3 10 21.6L12 16L14 21.6C14.3 22.3 15.1 22.6 15.8 22.3C16.5 22 16.8 21.2 16.5 20.5L14 14V11L18.4 12C18.5 12 18.6 12 18.7 12C19.4 12 20 11.4 20 10.7C20 10.1 19.5 9.6 19 9.5C16 9 12 8 12 8Z" fill="currentColor"/>
          </svg>
        </button>

        {accessibilityOpen && (
          <div className="accessibility-menu">
            <h3>נגישות</h3>

            <div className="accessibility-option">
              <span>גודל טקסט</span>
              <div className="font-controls">
                <button onClick={decreaseFontSize} aria-label="הקטן טקסט">א-</button>
                <span>{fontSize}%</span>
                <button onClick={increaseFontSize} aria-label="הגדל טקסט">א+</button>
              </div>
            </div>

            <div className="accessibility-option">
              <label>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                />
                ניגודיות גבוהה
              </label>
            </div>

            <div className="accessibility-option">
              <label>
                <input
                  type="checkbox"
                  checked={linkHighlight}
                  onChange={(e) => setLinkHighlight(e.target.checked)}
                />
                הדגשת קישורים
              </label>
            </div>

            <button className="accessibility-reset" onClick={resetAccessibility}>
              איפוס הגדרות
            </button>
          </div>
        )}
      </div>

      {/* Navigation Bar */}
      <nav className={`nav-bar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <img src="/logo.png" alt="AB" />
          </Link>

          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            <span className={menuOpen ? 'open' : ''}></span>
          </button>

          <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
            <Link to="/#about" onClick={() => setMenuOpen(false)}>נעים מאוד</Link>
            <a href="#" className="nav-btn-connect" onClick={showConnectionInstructions}>בואו נתחבר</a>
            <Link to="/#contact" onClick={() => setMenuOpen(false)}>צור קשר</Link>
          </div>
        </div>
      </nav>

      {/* Background animation */}
      <div className="home-bg">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="floating-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 15}s`
            }}
          />
        ))}
      </div>

      <div className="home-container">
        {/* TV Section - Left Side */}
        <div className="home-section tv-section">
          {tvStatus === 'waiting' && (
            <>
              <div className="section-header">
                <h2>חיבור טלוויזיה</h2>
                <p>סרוק את הקוד כדי להתחבר</p>
              </div>

              <div className="qr-wrapper">
                <div className="qr-frame">
                  <QRCodeSVG
                    value={pairUrl}
                    size={280}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#1a1a2e"
                  />
                  <div className="scan-overlay">
                    <div className="scan-line"></div>
                  </div>
                </div>
                <div className="pairing-code" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
                  קוד צימוד: <span>{pairingCode}</span>
                </div>
              </div>
            </>
          )}

          {tvStatus === 'paired' && (
            <div className="paired-success">
              <div className="success-icon">✓</div>
              <h2>הטלוויזיה מחוברת!</h2>
              <p>עובר למסך התצוגה...</p>
            </div>
          )}

          {tvStatus === 'error' && (
            <div className="error-state">
              <h2>שגיאה בחיבור</h2>
              <button onClick={generatePairingCode} className="retry-btn">נסה שוב</button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="section-divider">
          <div className="divider-line"></div>
          <span>או</span>
          <div className="divider-line"></div>
        </div>

        {/* Phone Section - Right Side */}
        <div className="home-section phone-section">
          <div className="section-header">
            <h2>התחברות</h2>
            <p>הזן קוד עבודה (3 ספרות)</p>
          </div>

          <form onSubmit={handleSubmit} className="code-form">
            <div className="code-display workspace-code">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`code-digit ${code[i] ? 'filled' : ''}`}>
                  {code[i] || ''}
                </div>
              ))}
            </div>

            {error && <div className="code-error">{error}</div>}

            <div className="number-pad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="num-btn"
                  onClick={() => handleKeyPress(num.toString())}
                >
                  {num}
                </button>
              ))}
              <button type="button" className="num-btn clear-btn" onClick={handleClear}>C</button>
              <button type="button" className="num-btn" onClick={() => handleKeyPress('0')}>0</button>
              <button type="button" className="num-btn back-btn" onClick={handleBackspace}>←</button>
            </div>

            <button
              type="submit"
              className="enter-btn"
              disabled={code.length !== 3}
            >
              המשך
            </button>
          </form>

          <div className="auth-links">
            <Link to="/login">התחברות עם סיסמה</Link>
            <span> | </span>
            <Link to="/register">הרשמה</Link>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {scannerOpen && (
        <div className="qr-scanner-modal">
          <div className="qr-scanner-container">
            <button className="close-scanner" onClick={closeScanner}>✕</button>
            <h3>סרקו את קוד ה-QR</h3>
            <p>קרבו את הטלפון לקוד עד שהוא ממלא את המסגרת</p>
            <div id="qr-reader" ref={scannerRef}></div>
            <div className="scanner-tip">
              <span>💡</span> טיפ: החזיקו את הטלפון יציב וקרוב לקוד
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectPage
