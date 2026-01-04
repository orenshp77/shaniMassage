import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api from '../services/api'
import './TVPairPage.css'

function TVPairPage() {
  const [pairingCode, setPairingCode] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [status, setStatus] = useState('waiting') // waiting, paired, error
  const [workspaceCode, setWorkspaceCode] = useState('')
  const navigate = useNavigate()

  // Generate pairing code on mount
  useEffect(() => {
    const url = window.location.origin
    setBaseUrl(url)
    generatePairingCode()
  }, [])

  const generatePairingCode = async () => {
    try {
      const response = await api.post('/tv/generate-code')
      setPairingCode(response.data.pairingCode)
      setStatus('waiting')
    } catch (error) {
      console.error('Error generating pairing code:', error)
      setStatus('error')
    }
  }

  // Poll for pairing status
  const checkPairingStatus = useCallback(async () => {
    if (!pairingCode || status !== 'waiting') return

    try {
      const response = await api.get(`/tv/check-pairing/${pairingCode}`)
      if (response.data.paired) {
        setStatus('paired')
        setWorkspaceCode(response.data.workspaceCode)

        // Store workspace info
        localStorage.setItem('workspaceCode', response.data.workspaceCode)
        localStorage.setItem('displayName', response.data.displayName)
        localStorage.setItem('tvMode', 'true')

        // Navigate to display page after short delay
        setTimeout(() => {
          navigate(`/?ws=${response.data.workspaceCode}&type=display`)
        }, 2000)
      }
    } catch (error) {
      // Pairing not found yet, continue polling
    }
  }, [pairingCode, status, navigate])

  useEffect(() => {
    const interval = setInterval(checkPairingStatus, 2000)
    return () => clearInterval(interval)
  }, [checkPairingStatus])

  // QR URL for phone to scan
  const pairUrl = `${baseUrl}/pair?code=${pairingCode}`

  return (
    <div className="tv-pair-page">
      {/* Animated background */}
      <div className="tv-bg">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="floating-orb"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 15}s`
            }}
          />
        ))}
      </div>

      <div className="tv-content">
        {status === 'waiting' && (
          <>
            <div className="tv-header">
              <h1>מוקד עידכונים</h1>
              <p>סרוק את הקוד מהטלפון כדי להתחבר</p>
            </div>

            <div className="qr-section">
              <div className="qr-frame">
                <QRCodeSVG
                  value={pairUrl}
                  size={350}
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

            <div className="tv-instructions">
              <div className="instruction-step">
                <span className="step-number">1</span>
                <span className="step-text">פתח את המצלמה בטלפון</span>
              </div>
              <div className="instruction-step">
                <span className="step-number">2</span>
                <span className="step-text">סרוק את הקוד</span>
              </div>
              <div className="instruction-step">
                <span className="step-number">3</span>
                <span className="step-text">התחבר לחשבון שלך</span>
              </div>
            </div>
          </>
        )}

        {status === 'paired' && (
          <div className="paired-success">
            <div className="success-icon">✓</div>
            <h2>הטלוויזיה מחוברת!</h2>
            <p>עובר למסך התצוגה...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="error-state">
            <h2>שגיאה בחיבור</h2>
            <button onClick={generatePairingCode}>נסה שוב</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TVPairPage
