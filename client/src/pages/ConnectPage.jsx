import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'
import './ConnectPage.css'

function ConnectPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [workspace, setWorkspace] = useState(null)
  const [accessType, setAccessType] = useState(null) // 'input' or 'display'
  const [step, setStep] = useState('workspace') // 'workspace' or 'pin'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Check for workspace code in URL (from QR scan)
  useEffect(() => {
    const wsCode = searchParams.get('ws')
    const type = searchParams.get('type')
    if (wsCode) {
      fetchWorkspace(wsCode, type)
    }
  }, [searchParams])

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
      // First step: enter workspace code (6 chars)
      if (code.length === 6) {
        await fetchWorkspace(code.toUpperCase())
      }
    } else if (step === 'pin') {
      // Second step: enter PIN
      if (code.length === 4 && workspace) {
        try {
          const response = await api.post('/auth/pin-login', {
            workspaceCode: workspace.workspace_code,
            pin: code,
            type: accessType || 'input' // default to input if not specified
          })

          // Store workspace info
          localStorage.setItem('workspaceCode', workspace.workspace_code)
          localStorage.setItem('displayName', workspace.display_name)

          // Navigate based on access type
          if (accessType === 'display') {
            navigate('/display')
          } else {
            navigate('/input')
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
    const maxLength = step === 'workspace' ? 6 : 4
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

  return (
    <div className="connect-page">
      {/* Background animation */}
      <div className="connect-bg">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="connect-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <div className="connect-container">
        <div className="connect-logo">
          <h1>{workspace ? workspace.display_name : 'Shani'}</h1>
          <p>
            {step === 'workspace'
              ? 'הזן קוד עבודה (6 תווים)'
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
              <span className="access-label">ניהול הודעות</span>
              <span className="access-hint">עמוד הקלדה</span>
            </button>
            <button
              className="access-type-btn display-btn"
              onClick={() => selectAccessType('display')}
            >
              <span className="access-icon">📺</span>
              <span className="access-label">מסך תצוגה</span>
              <span className="access-hint">טלוויזיה</span>
            </button>
          </div>
        )}

        {(step === 'workspace' || accessType) && (
          <form onSubmit={handleSubmit} className="code-form">
            {/* Code display */}
            <div className={`code-display ${step === 'workspace' ? 'workspace-code' : ''}`}>
              {[...Array(step === 'workspace' ? 6 : 4)].map((_, i) => (
                <div key={i} className={`code-digit ${code[i] ? 'filled' : ''}`}>
                  {code[i] || ''}
                </div>
              ))}
            </div>

            {error && <div className="code-error">{error}</div>}

            {/* Number/Letter pad */}
            <div className={`number-pad ${step === 'workspace' ? 'alpha-pad' : ''}`}>
              {step === 'workspace' ? (
                // Alphanumeric pad for workspace code
                <>
                  {['1', '2', '3', 'A', 'B', 'C', '4', '5', '6', 'D', 'E', 'F', '7', '8', '9', '0'].map((char) => (
                    <button
                      key={char}
                      type="button"
                      className="num-btn"
                      onClick={() => handleKeyPress(char)}
                    >
                      {char}
                    </button>
                  ))}
                  <button type="button" className="num-btn clear-btn" onClick={handleClear}>C</button>
                  <button type="button" className="num-btn back-btn" onClick={handleBackspace}>←</button>
                </>
              ) : (
                // Numeric pad for PIN
                <>
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
                </>
              )}
            </div>

            <button
              type="submit"
              className="enter-btn"
              disabled={step === 'workspace' ? code.length !== 6 : code.length !== 4}
            >
              {step === 'workspace' ? 'המשך' : 'כניסה'}
            </button>

            {step === 'pin' && (
              <button type="button" className="back-link" onClick={handleBack}>
                חזרה לבחירת קוד עבודה
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
  )
}

export default ConnectPage
