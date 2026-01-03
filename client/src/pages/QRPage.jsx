import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import './QRPage.css'

function QRPage() {
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    // Get the current base URL automatically
    const url = window.location.origin
    setBaseUrl(url)
  }, [])

  const inputUrl = `${baseUrl}/input`
  const displayUrl = `${baseUrl}/display`

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
          <h1>Shani System</h1>
          <p>סרוק את הקוד כדי להתחבר</p>
        </header>

        <div className="qr-cards">
          {/* Input Page QR */}
          <div className="qr-card input-card">
            <div className="qr-icon">📝</div>
            <h2>עמוד הזנת הודעות</h2>
            <p>סרוק כדי להזין הודעות חדשות</p>
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
            <div className="url-display">{inputUrl}</div>
          </div>

          {/* Display Page QR */}
          <div className="qr-card display-card">
            <div className="qr-icon">📺</div>
            <h2>עמוד תצוגה</h2>
            <p>סרוק להצגה על מסך גדול</p>
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
            <div className="url-display">{displayUrl}</div>
          </div>
        </div>

        <div className="qr-instructions">
          <h3>איך זה עובד?</h3>
          <ol>
            <li>📱 פתח את המצלמה בטלפון</li>
            <li>🎯 כוון על הקוד הרצוי</li>
            <li>🔗 לחץ על הקישור שמופיע</li>
            <li>✨ זהו! אתה מחובר</li>
          </ol>
        </div>

        <a href="/" className="back-link">חזור לעמוד הראשי</a>
      </div>
    </div>
  )
}

export default QRPage
