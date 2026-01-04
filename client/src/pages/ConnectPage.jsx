import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api from '../services/api'
import './ConnectPage.css'

function ConnectPage() {
  // Phone/Connect side state
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [workspace, setWorkspace] = useState(null)
  const [accessType, setAccessType] = useState(null)
  const [step, setStep] = useState('workspace')

  // TV side state
  const [pairingCode, setPairingCode] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [tvStatus, setTvStatus] = useState('waiting')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Initialize - generate pairing code only once
  useEffect(() => {
    const url = window.location.origin
    setBaseUrl(url)
    generatePairingCode()
  }, [])

  // Check for workspace code in URL (from QR scan)
  useEffect(() => {
    const wsCode = searchParams.get('ws')
    const type = searchParams.get('type')
    if (wsCode) {
      fetchWorkspace(wsCode, type)
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
      }
    } catch (error) {
      // Pairing not found yet, continue polling
    }
  }, [pairingCode, tvStatus, navigate])

  useEffect(() => {
    const interval = setInterval(checkPairingStatus, 2000)
    return () => clearInterval(interval)
  }, [checkPairingStatus])

  // Phone side functions
  const fetchWorkspace = async (wsCode, type = null) => {
    try {
      const response = await api.get(`/auth/workspace/${wsCode}`)
      setWorkspace(response.data.workspace)
      if (type) {
        setAccessType(type)
      }
      setStep('pin')
      setCode('')
    } catch (error) {
      setError('קוד עבודה לא נמצא')
      setTimeout(() => setError(''), 2000)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (step === 'workspace') {
      if (code.length === 3) {
        await fetchWorkspace(code)
      }
    } else if (step === 'pin') {
      if (code.length === 4 && workspace) {
        try {
          await api.post('/auth/pin-login', {
            workspaceCode: workspace.workspace_code,
            pin: code,
            type: accessType || 'input'
          })

          localStorage.setItem('workspaceCode', workspace.workspace_code)
          localStorage.setItem('displayName', workspace.display_name)

          if (accessType === 'display') {
            navigate('/display')
          } else {
            // Navigate to QR page for management access
            navigate('/qr')
          }
        } catch (error) {
          setError('קוד PIN שגוי')
          setTimeout(() => setError(''), 2000)
          setCode('')
        }
      }
    }
  }

  const handleKeyPress = (char) => {
    const maxLength = step === 'workspace' ? 3 : 4
    if (code.length < maxLength) {
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

  const handleBack = () => {
    setStep('workspace')
    setWorkspace(null)
    setAccessType(null)
    setCode('')
    setError('')
  }

  const selectAccessType = (type) => {
    setAccessType(type)
    setCode('')
  }

  // QR URL for phone to scan
  const pairUrl = `${baseUrl}/pair?code=${pairingCode}`

  return (
    <div className="home-page">
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
                <div className="section-icon">📺</div>
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
                <div className="pairing-code">
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
            <div className="section-icon">📱</div>
            <h2>{workspace ? workspace.display_name : 'התחברות'}</h2>
            <p>
              {step === 'workspace'
                ? 'הזן קוד עבודה (3 ספרות)'
                : accessType
                  ? `הזן PIN ${accessType === 'display' ? 'למסך' : 'לניהול'}`
                  : 'בחר סוג גישה'
              }
            </p>
          </div>

          {step === 'pin' && !accessType && (
            <div className="access-type-selector">
              <button
                className="access-type-btn input-btn"
                onClick={() => selectAccessType('input')}
              >
                <span className="access-icon">⌨️</span>
                <span className="access-label">ניהול</span>
              </button>
              <button
                className="access-type-btn display-btn"
                onClick={() => selectAccessType('display')}
              >
                <span className="access-icon">📺</span>
                <span className="access-label">תצוגה</span>
              </button>
            </div>
          )}

          {(step === 'workspace' || accessType) && (
            <form onSubmit={handleSubmit} className="code-form">
              <div className={`code-display ${step === 'workspace' ? 'workspace-code' : ''}`}>
                {[...Array(step === 'workspace' ? 3 : 4)].map((_, i) => (
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
                disabled={step === 'workspace' ? code.length !== 3 : code.length !== 4}
              >
                {step === 'workspace' ? 'המשך' : 'כניסה'}
              </button>

              {step === 'pin' && (
                <button type="button" className="back-link" onClick={handleBack}>
                  חזרה
                </button>
              )}
            </form>
          )}

          <div className="auth-links">
            <Link to="/login">התחברות עם סיסמה</Link>
            <span> | </span>
            <Link to="/register">הרשמה</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectPage
