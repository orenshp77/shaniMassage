import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import Swal from 'sweetalert2'
import './AuthPages.css'

function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    displayName: '',
    inputPin: '',
    displayPin: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    // For PIN fields, only allow digits and max 4 characters
    if ((name === 'inputPin' || name === 'displayPin') && value.length > 4) return
    if ((name === 'inputPin' || name === 'displayPin') && !/^\d*$/.test(value)) return

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.inputPin.length !== 4 || formData.displayPin.length !== 4) {
      Swal.fire({
        icon: 'error',
        title: 'שגיאה',
        text: 'סיסמאות ה-PIN חייבות להכיל 4 ספרות'
      })
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/register', formData)

      // Save workspace info to localStorage
      localStorage.setItem('workspaceCode', response.data.user.workspace_code)
      localStorage.setItem('displayName', formData.displayName)

      // Check if there's a pending pairing code
      const pendingPairingCode = sessionStorage.getItem('pendingPairingCode')

      if (pendingPairingCode) {
        Swal.fire({
          icon: 'success',
          title: 'נרשמת בהצלחה!',
          html: `
            <div style="text-align: right; direction: rtl;">
              <p><strong>קוד העבודה שלך:</strong> ${response.data.user.workspace_code}</p>
              <p>עכשיו נחבר את הטלוויזיה...</p>
            </div>
          `,
          confirmButtonText: 'חבר טלוויזיה',
          timer: 3000
        }).then(() => {
          navigate(`/pair?code=${pendingPairingCode}`)
        })
      } else {
        Swal.fire({
          icon: 'success',
          title: 'נרשמת בהצלחה!',
          html: `
            <div style="text-align: right; direction: rtl;">
              <p><strong>קוד העבודה שלך:</strong> ${response.data.user.workspace_code}</p>
              <p>שמור את הקוד הזה - תצטרך אותו להתחברות</p>
            </div>
          `,
          confirmButtonText: 'המשך'
        }).then(() => {
          navigate('/qr')
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'שגיאה',
        text: error.response?.data?.error || 'שגיאה ביצירת המשתמש'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="floating-shape" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }} />
        ))}
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">הרשמה למערכת</h1>
          <p className="auth-subtitle">צור חשבון חדש לניהול מרחב העבודה שלך</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>שם משתמש</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="הכנס שם משתמש"
                required
              />
            </div>

            <div className="form-group">
              <label>סיסמה</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="הכנס סיסמה"
                required
              />
            </div>

            <div className="form-group">
              <label>שם להצגה על הלוח</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="השם שיופיע על מסך התצוגה"
                required
              />
            </div>

            <div className="pin-row">
              <div className="form-group">
                <label>PIN לניהול (4 ספרות)</label>
                <input
                  type="password"
                  name="inputPin"
                  value={formData.inputPin}
                  onChange={handleChange}
                  placeholder="0000"
                  maxLength={4}
                  pattern="\d{4}"
                  required
                />
                <span className="hint">לכניסה לעמוד הניהול</span>
              </div>

              <div className="form-group">
                <label>PIN למסך (4 ספרות)</label>
                <input
                  type="password"
                  name="displayPin"
                  value={formData.displayPin}
                  onChange={handleChange}
                  placeholder="0000"
                  maxLength={4}
                  pattern="\d{4}"
                  required
                />
                <span className="hint">להצגה על הטלוויזיה</span>
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'יוצר חשבון...' : 'הרשמה'}
            </button>
          </form>

          <div className="auth-footer">
            <p>כבר יש לך חשבון? <Link to="/login">התחבר כאן</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
