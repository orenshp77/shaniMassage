import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import './HomePage.css'

function HomePage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)
  const [fontSize, setFontSize] = useState(100)
  const [highContrast, setHighContrast] = useState(false)
  const [linkHighlight, setLinkHighlight] = useState(false)

  // Refs for scroll animations
  const aboutRef = useRef(null)
  const featuresRef = useRef(null)
  const usecasesRef = useRef(null)
  const ctaRef = useRef(null)
  const contactRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in')
        }
      })
    }, observerOptions)

    const refs = [aboutRef, featuresRef, usecasesRef, ctaRef, contactRef]
    refs.forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })

    return () => observer.disconnect()
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
          <div style="margin-bottom: 15px;">
            <img src="/tv.png" alt="TV" style="max-width: 100%; height: auto; margin: 0 auto; display: block;" />
          </div>

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
        // Navigate to connect page and try to open camera
        navigate('/connect')
      }
    })
  }

  const features = [
    {
      icon: '📺',
      title: 'תצוגה חכמה',
      description: 'הצג הודעות על מסך טלוויזיה בזמן אמת עם עיצוב מרהיב ואנימציות מקצועיות',
      image: '/feature-display.svg'
    },
    {
      icon: '📱',
      title: 'שליטה מהנייד',
      description: 'שלח והוסף הודעות בקלות מכל מכשיר - טלפון, טאבלט או מחשב',
      image: '/feature-mobile.svg'
    },
    {
      icon: '🔔',
      title: 'התראות מיידיות',
      description: 'צליל התראה והודעה צצה מיידית על המסך כשיש עדכון חדש',
      image: '/feature-alert.svg'
    },
    {
      icon: '🎨',
      title: 'עיצוב מותאם',
      description: 'התאם צבעים, גדלים וסגנון לזהות החזותית של העסק שלך',
      image: '/feature-design.svg'
    }
  ]

  const useCases = [
    {
      title: 'מוקדי שירות',
      description: 'ניהול תורים והצגת מספרי לקוחות',
      icon: '🏢'
    },
    {
      title: 'מסעדות וקפה',
      description: 'הצגת הזמנות מוכנות ומבצעים',
      icon: '🍽️'
    },
    {
      title: 'מרפאות',
      description: 'קריאה לחדרי טיפול והודעות למטופלים',
      icon: '🏥'
    },
    {
      title: 'משרדים',
      description: 'עדכונים פנימיים והודעות לעובדים',
      icon: '💼'
    }
  ]

  return (
    <div className="home-landing">
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
          <div className="accessibility-menu" onClick={(e) => e.stopPropagation()}>
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

      {/* Navigation */}
      <nav className={`nav-bar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <img src="/logo.png" alt="AB" />
          </Link>

          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            <span className={menuOpen ? 'open' : ''}></span>
          </button>

          <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
            <a href="#about" onClick={() => setMenuOpen(false)}>נעים מאוד</a>
            <a href="#" className="nav-btn-connect" onClick={showConnectionInstructions}>בואו נתחבר</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>צור קשר</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="hero-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${15 + Math.random() * 15}s`
              }}
            />
          ))}
        </div>

        <div className="hero-content">
          <h1>
            <span className="gradient-text">שידור חכם</span>
            <br />
            למוקדי שירות
          </h1>
          <p className="hero-subtitle">
            הפתרון המושלם להצגת הודעות, קריאות ועדכונים על מסכי טלוויזיה בזמן אמת
          </p>
          <div className="hero-buttons">
            <Link to="/connect" className="btn btn-primary">
              התחל עכשיו
              <span className="btn-arrow">←</span>
            </Link>
            <a href="#features" className="btn btn-secondary">
              גלה עוד
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="tv-mockup">
            <div className="tv-screen">
              <div className="mock-message">
                <span className="mock-number">42</span>
                <span className="mock-text">אנא גש לעמדה 3</span>
              </div>
            </div>
            <div className="tv-stand"></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section scroll-animate" ref={aboutRef}>
        <div className="section-container">
          <h2 className="section-title">נעים מאוד</h2>
          <p className="section-subtitle">
            AB שירות לקוחות חכם - המערכת שמשדרגת את חווית השירות
          </p>

          <div className="about-content">
            <div className="about-text">
              <p>
                אנחנו מאמינים ששירות לקוחות טוב מתחיל בתקשורת ברורה.
                המערכת שלנו מאפשרת להציג הודעות על מסכי טלוויזיה בזמן אמת,
                לנהל תורים בצורה חכמה ולשמור על לקוחות מעודכנים.
              </p>
              <p>
                בין אם אתם מנהלים מוקד שירות, מרפאה, מסעדה או כל עסק אחר -
                המערכת שלנו תעזור לכם לתקשר עם הלקוחות בצורה יעילה ומקצועית.
              </p>
            </div>
            <div className="about-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">עסקים פעילים</span>
              </div>
              <div className="stat">
                <span className="stat-number">1M+</span>
                <span className="stat-label">הודעות נשלחו</span>
              </div>
              <div className="stat">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">זמינות</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section scroll-animate" ref={featuresRef}>
        <div className="section-container">
          <h2 className="section-title">היתרונות שלנו</h2>
          <p className="section-subtitle">כל מה שצריך לשירות לקוחות מעולה</p>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="usecases-section scroll-animate" ref={usecasesRef}>
        <div className="section-container">
          <h2 className="section-title">מתאים לכל עסק</h2>
          <p className="section-subtitle">פתרונות מותאמים לכל תחום</p>

          <div className="usecases-grid">
            {useCases.map((useCase, index) => (
              <div key={index} className="usecase-card">
                <span className="usecase-icon">{useCase.icon}</span>
                <h3>{useCase.title}</h3>
                <p>{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section scroll-animate" ref={ctaRef}>
        <div className="section-container">
          <h2>מוכנים להתחיל?</h2>
          <p>הצטרפו לאלפי עסקים שכבר משתמשים במערכת</p>
          <Link to="/connect" className="btn btn-primary btn-large">
            התחברו עכשיו - חינם!
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section scroll-animate" ref={contactRef}>
        <div className="section-container">
          <h2 className="section-title">צור קשר</h2>
          <p className="section-subtitle">נשמח לענות על כל שאלה</p>

          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <div>
                  <h4>אימייל</h4>
                  <a href="mailto:orenshp77@gmail.com">orenshp77@gmail.com</a>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <div>
                  <h4>טלפון</h4>
                  <a href="tel:0523715599">052-3715599</a>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">💬</span>
                <div>
                  <h4>וואטסאפ</h4>
                  <a href="https://wa.me/972523715599" target="_blank" rel="noopener noreferrer">שלח הודעה</a>
                </div>
              </div>
            </div>

            <form className="contact-form">
              <input type="text" placeholder="שם מלא" required />
              <input type="email" placeholder="אימייל" required />
              <input type="tel" placeholder="טלפון" />
              <textarea placeholder="הודעה" rows="4" required></textarea>
              <button type="submit" className="btn btn-primary">שלח הודעה</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-logo">
            <img src="/logo.png" alt="AB" />
            <p>שירות לקוחות חכם</p>
          </div>
          <div className="footer-links">
            <a href="#about">אודות</a>
            <a href="#features">יתרונות</a>
            <a href="#contact">צור קשר</a>
            <Link to="/connect">התחברות</Link>
          </div>
          <div className="footer-copy">
            © 2025 AB שירות לקוחות חכם. כל הזכויות שמורות.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
