import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ConnectPage.css'

function ConnectPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Simple codes for easy access
  const CODES = {
    '1111': '/display',    // Display page
    '2222': '/input',      // Input page
    '3333': '/qr',         // QR page
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (CODES[code]) {
      navigate(CODES[code])
    } else {
      setError('קוד לא תקין')
      setTimeout(() => setError(''), 2000)
    }
  }

  const handleKeyPress = (num) => {
    if (code.length < 4) {
      setCode(prev => prev + num)
    }
  }

  const handleClear = () => {
    setCode('')
    setError('')
  }

  const handleBackspace = () => {
    setCode(prev => prev.slice(0, -1))
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
          <h1>Shani</h1>
          <p>הזן קוד גישה</p>
        </div>

        <form onSubmit={handleSubmit} className="code-form">
          {/* Code display */}
          <div className="code-display">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`code-digit ${code[i] ? 'filled' : ''}`}>
                {code[i] || ''}
              </div>
            ))}
          </div>

          {error && <div className="code-error">{error}</div>}

          {/* Number pad */}
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
            <button
              type="button"
              className="num-btn clear-btn"
              onClick={handleClear}
            >
              C
            </button>
            <button
              type="button"
              className="num-btn"
              onClick={() => handleKeyPress('0')}
            >
              0
            </button>
            <button
              type="button"
              className="num-btn back-btn"
              onClick={handleBackspace}
            >
              ←
            </button>
          </div>

          <button
            type="submit"
            className="enter-btn"
            disabled={code.length !== 4}
          >
            כניסה
          </button>
        </form>

        <div className="code-hints">
          <p>קודי גישה:</p>
          <div className="hints-list">
            <span><strong>1111</strong> = מסך תצוגה</span>
            <span><strong>2222</strong> = הזנת הודעות</span>
            <span><strong>3333</strong> = קודי QR</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectPage
