import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../services/firebase'
import Swal from 'sweetalert2'
import './AuthPages.css'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await loginUser(formData.username, formData.password)
      const user = response.user

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('workspaceCode', user.workspace_code)

      Swal.fire({
        icon: 'success',
        title: `ברוך הבא, ${user.display_name}!`,
        html: `<p>קוד העבודה שלך: <strong>${user.workspace_code}</strong></p>`,
        showConfirmButton: false,
        timer: 2000
      }).then(() => {
        // Check if there's a pending pairing code (user came from TV pairing)
        const pendingPairingCode = sessionStorage.getItem('pendingPairingCode')
        if (pendingPairingCode) {
          sessionStorage.removeItem('pendingPairingCode')
          navigate(`/pair?code=${pendingPairingCode}`)
        } else {
          navigate('/qr')
        }
      })
    } catch (error) {
      const errorMessage = error.message || 'שגיאה בהתחברות'

      Swal.fire({
        icon: 'error',
        title: 'פרטים שגויים',
        text: errorMessage,
        confirmButtonText: 'נסה שוב',
        confirmButtonColor: '#00bcd4'
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
          <h1 className="auth-title">התחברות</h1>
          <p className="auth-subtitle">הכנס לחשבון שלך לניהול מרחב העבודה</p>

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

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'מתחבר...' : 'התחברות'}
            </button>
          </form>

          <div className="auth-divider">
            <span>או</span>
          </div>

          <button
            className="auth-btn secondary"
            onClick={() => navigate('/')}
          >
            כניסה מהירה עם קוד
          </button>

          <div className="auth-footer">
            <p>אין לך חשבון? <Link to="/register">הרשם כאן</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
