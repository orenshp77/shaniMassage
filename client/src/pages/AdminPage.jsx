import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllUsers, deleteUser, updateUserPassword, loginAsUser, clearAllData } from '../services/firebase'
import Swal from 'sweetalert2'
import './AdminPage.css'

// Admin credentials
const ADMIN_USERNAME = 'oren'
const ADMIN_PASSWORD = 'oren715599'

function AdminPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Check if already authenticated in this session
    const adminAuth = sessionStorage.getItem('adminAuth')
    if (adminAuth === 'true') {
      setIsAuthenticated(true)
      fetchUsers()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUsers = async () => {
    try {
      const users = await getAllUsers()
      setUsers(users)
    } catch (error) {
      console.error('Error fetching users:', error)
      Swal.fire({
        icon: 'error',
        title: 'שגיאה',
        text: 'לא ניתן לטעון את רשימת המשתמשים'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (user) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'מחיקת משתמש',
      html: `<p>האם למחוק את המשתמש <strong>${user.display_name}</strong>?</p>
             <p style="color: #e74c3c; font-size: 0.9rem;">פעולה זו תמחק גם את כל ההודעות וההגדרות שלו!</p>`,
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'כן, מחק',
      cancelButtonText: 'ביטול'
    })

    if (result.isConfirmed) {
      try {
        await deleteUser(user.id)
        Swal.fire({
          icon: 'success',
          title: 'המשתמש נמחק',
          showConfirmButton: false,
          timer: 1500
        })
        fetchUsers()
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'שגיאה',
          text: 'לא ניתן למחוק את המשתמש'
        })
      }
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      Swal.fire({ icon: 'error', title: 'שגיאה', text: 'יש להזין סיסמה חדשה' })
      return
    }

    try {
      await updateUserPassword(selectedUser.id, newPassword)
      Swal.fire({
        icon: 'success',
        title: 'הסיסמה עודכנה',
        showConfirmButton: false,
        timer: 1500
      })
      setNewPassword('')
      setSelectedUser(null)
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'שגיאה', text: 'לא ניתן לעדכן את הסיסמה' })
    }
  }

  const handleLoginAsUser = async (user) => {
    try {
      const result = await loginAsUser(user.id)
      const userData = result.user

      // Store user data
      localStorage.setItem('workspaceCode', userData.workspace_code)
      localStorage.setItem('displayName', userData.display_name)
      localStorage.setItem('user', JSON.stringify(userData))

      Swal.fire({
        icon: 'success',
        title: `נכנסת כ-${userData.display_name}`,
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        navigate('/input')
      })
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'שגיאה', text: 'לא ניתן להיכנס כמשתמש זה' })
    }
  }

  const handleClearAll = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'מחיקת כל הנתונים',
      html: `<p style="color: #e74c3c; font-weight: bold;">פעולה זו תמחק את כל המשתמשים, ההודעות וההגדרות!</p>
             <p>האם אתה בטוח?</p>`,
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'כן, מחק הכל',
      cancelButtonText: 'ביטול'
    })

    if (result.isConfirmed) {
      try {
        await clearAllData()
        Swal.fire({
          icon: 'success',
          title: 'כל הנתונים נמחקו',
          showConfirmButton: false,
          timer: 1500
        })
        fetchUsers()
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'שגיאה', text: 'לא ניתן למחוק את הנתונים' })
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleAdminLogin = (e) => {
    e.preventDefault()
    if (adminUsername === ADMIN_USERNAME && adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem('adminAuth', 'true')
      setLoginError('')
      fetchUsers()
    } else {
      setLoginError('שם משתמש או סיסמה שגויים')
    }
  }

  const handleAdminLogout = () => {
    sessionStorage.removeItem('adminAuth')
    setIsAuthenticated(false)
    setAdminUsername('')
    setAdminPassword('')
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading">טוען...</div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="admin-bg">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="floating-shape" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }} />
          ))}
        </div>
        <div className="admin-login-container">
          <div className="admin-login-card">
            <h1>ניהול מערכת</h1>
            <p>נא להזין פרטי מנהל</p>
            <form onSubmit={handleAdminLogin}>
              <div className="login-input-group">
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="שם משתמש"
                  autoComplete="username"
                />
              </div>
              <div className="login-input-group">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="סיסמה"
                  autoComplete="current-password"
                />
              </div>
              {loginError && <div className="login-error">{loginError}</div>}
              <button type="submit" className="btn btn-primary login-btn">
                כניסה
              </button>
            </form>
            <button className="btn btn-secondary back-btn" onClick={() => navigate('/')}>
              חזרה
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-bg">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="floating-shape" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }} />
        ))}
      </div>

      <div className="admin-container">
        <header className="admin-header">
          <h1>ניהול מערכת</h1>
          <div className="header-actions">
            <button className="btn btn-danger" onClick={handleClearAll}>
              מחק הכל
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              חזרה
            </button>
            <button className="btn btn-logout" onClick={handleAdminLogout}>
              התנתק
            </button>
          </div>
        </header>

        <div className="users-section">
          <h2>משתמשים רשומים ({users.length})</h2>

          {users.length === 0 ? (
            <div className="no-users">
              <p>אין משתמשים במערכת</p>
              <button className="btn btn-primary" onClick={() => navigate('/register')}>
                צור משתמש חדש
              </button>
            </div>
          ) : (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>שם תצוגה</th>
                    <th>שם משתמש</th>
                    <th>קוד עבודה</th>
                    <th>נוצר</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="display-name">{user.display_name}</td>
                      <td>{user.username}</td>
                      <td className="workspace-code">{user.workspace_code}</td>
                      <td className="date">{formatDate(user.created_at)}</td>
                      <td className="actions">
                        <button
                          className="action-btn enter"
                          onClick={() => handleLoginAsUser(user)}
                          title="כניסה כמשתמש"
                        >
                          כניסה
                        </button>
                        <button
                          className="action-btn edit"
                          onClick={() => setSelectedUser(user)}
                          title="עריכה"
                        >
                          עריכה
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteUser(user)}
                          title="מחיקה"
                        >
                          מחק
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {selectedUser && (
          <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>עריכת משתמש: {selectedUser.display_name}</h3>

              <div className="modal-section">
                <h4>שינוי סיסמה</h4>
                <div className="input-group">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="סיסמה חדשה"
                  />
                  <button className="btn btn-primary" onClick={handleUpdatePassword}>
                    עדכן סיסמה
                  </button>
                </div>
              </div>

              <button className="btn btn-secondary close-btn" onClick={() => {
                setSelectedUser(null)
                setNewPassword('')
              }}>
                סגור
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage
