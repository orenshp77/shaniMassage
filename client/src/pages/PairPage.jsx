import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api from '../services/api'
import Swal from 'sweetalert2'
import './PairPage.css'

function PairPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [pairingCode, setPairingCode] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [status, setStatus] = useState('checking') // checking, showQR, pairing, success, error
  const [workspaceCode, setWorkspaceCode] = useState('')
  const [displayName, setDisplayName] = useState('')

  // Generate a new pairing code for TV to scan
  const generatePairingCode = async () => {
    try {
      const response = await api.post('/tv/generate-code')
      setPairingCode(response.data.pairingCode)
      setStatus('showQR')
    } catch (error) {
      console.error('Error generating pairing code:', error)
      setStatus('error')
    }
  }

  // Poll for TV pairing status
  const checkPairingStatus = useCallback(async () => {
    if (!pairingCode || status !== 'showQR') return

    try {
      const response = await api.get(`/tv/check-pairing/${pairingCode}`)
      if (response.data.paired) {
        setStatus('success')
        Swal.fire({
          icon: 'success',
          title: 'הטלוויזיה מחוברת!',
          text: 'הטלוויזיה נצמדה בהצלחה למרחב העבודה שלך',
          showConfirmButton: false,
          timer: 2000
        }).then(() => {
          navigate('/qr')
        })
      }
    } catch (error) {
      // Pairing not found yet, continue polling
    }
  }, [pairingCode, status, navigate])

  useEffect(() => {
    const url = window.location.origin
    setBaseUrl(url)

    // Get user info
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const storedWorkspace = user.workspace_code || localStorage.getItem('workspaceCode')
    const storedName = user.display_name || localStorage.getItem('displayName')

    if (storedWorkspace) {
      setWorkspaceCode(storedWorkspace)
      setDisplayName(storedName || 'מרחב העבודה שלי')
    }

    // Check if we have a code from URL (TV scanned QR)
    const code = searchParams.get('code')
    if (code) {
      // TV side - pair with this code
      setPairingCode(code)
      handlePairTV(code, storedWorkspace)
    } else {
      // Phone side - generate QR for TV to scan
      generatePairingCode()
    }
  }, [searchParams])

  useEffect(() => {
    if (status === 'showQR') {
      const interval = setInterval(checkPairingStatus, 2000)
      return () => clearInterval(interval)
    }
  }, [checkPairingStatus, status])

  // Handle pairing when TV scans the QR
  const handlePairTV = async (code, wsCode) => {
    if (!code || !wsCode) {
      setStatus('error')
      return
    }

    setStatus('pairing')

    try {
      await api.post('/tv/pair', {
        pairingCode: code,
        workspaceCode: wsCode
      })

      setStatus('success')
      // Store workspace info for display page
      localStorage.setItem('workspaceCode', wsCode)
      localStorage.setItem('tvMode', 'true')

      Swal.fire({
        icon: 'success',
        title: 'הטלוויזיה מחוברת!',
        showConfirmButton: false,
        timer: 2000
      }).then(() => {
        navigate('/display')
      })
    } catch (error) {
      setStatus('error')
      Swal.fire({
        icon: 'error',
        title: 'שגיאה',
        text: error.response?.data?.error || 'לא ניתן לצמד את הטלוויזיה'
      })
    }
  }

  // QR URL for TV to scan
  const pairUrl = `${baseUrl}/pair?code=${pairingCode}`

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

          {status === 'showQR' && (
            <>
              <p className="pair-message">
                סרוק את הקוד מהטלוויזיה כדי לחבר אותה ל:
              </p>
              <div className="workspace-info">
                <span className="workspace-name">{displayName}</span>
                <span className="workspace-code-small">{workspaceCode}</span>
              </div>

              <div className="qr-wrapper">
                <div className="qr-frame">
                  <QRCodeSVG
                    value={pairUrl}
                    size={220}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#1a1a2e"
                  />
                  <div className="scan-overlay">
                    <div className="scan-line"></div>
                  </div>
                </div>
                <div className="pairing-code-display">
                  קוד צימוד: <strong>{pairingCode}</strong>
                </div>
              </div>

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
              <button className="pair-btn primary" onClick={generatePairingCode}>
                נסה שוב
              </button>
              <button className="pair-btn secondary" onClick={() => navigate('/qr')}>
                חזור
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PairPage
