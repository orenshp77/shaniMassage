import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Swal from 'sweetalert2'
import './PairPage.css'

function PairPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [pairingCode, setPairingCode] = useState('')
  const [status, setStatus] = useState('checking') // checking, needLogin, ready, pairing, success, error
  const [workspaceCode, setWorkspaceCode] = useState('')
  const [displayName, setDisplayName] = useState('')

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
      const response = await api.post('/tv/pair', {
        pairingCode,
        workspaceCode
      })

      setStatus('success')
      Swal.fire({
        icon: 'success',
        title: 'הטלוויזיה מחוברת!',
        text: response.data.message,
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
        text: error.response?.data?.error || 'לא ניתן לצמד את הטלוויזיה'
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
              <button className="pair-btn primary large" onClick={handlePair}>
                חבר את הטלוויזיה
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
    </div>
  )
}

export default PairPage
