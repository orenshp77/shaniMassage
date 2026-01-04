import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import api from '../services/api'
import { THEMES } from '../components/AnimatedBackgrounds'
import './InputPage.css'

function InputPage() {
  const [messages, setMessages] = useState([])
  const [formData, setFormData] = useState({
    subject: '',
    content: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('hitech')
  const [pinnedMessage, setPinnedMessage] = useState('')
  const [pinnedEnabled, setPinnedEnabled] = useState(false)
  const [workspaceCode, setWorkspaceCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const navigate = useNavigate()
  const { workspaceCode: urlWorkspaceCode } = useParams()

  useEffect(() => {
    // Get workspace from URL or localStorage (workspace code is enough for access)
    const wsFromUrl = urlWorkspaceCode
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    const storedWorkspace = wsFromUrl || user?.workspace_code || localStorage.getItem('workspaceCode')
    const storedName = user?.display_name || localStorage.getItem('displayName')

    if (!storedWorkspace) {
      // No workspace - redirect to home
      navigate('/')
      return
    }

    // Save to localStorage for future use
    if (wsFromUrl) {
      localStorage.setItem('workspaceCode', wsFromUrl)
    }

    setWorkspaceCode(storedWorkspace)
    setDisplayName(storedName || 'מרחב העבודה שלי')

    fetchMessages(storedWorkspace)
    fetchCurrentTheme(storedWorkspace)
    fetchPinnedMessage(storedWorkspace)
  }, [navigate, urlWorkspaceCode])

  const fetchCurrentTheme = async (ws) => {
    try {
      const workspace = ws || localStorage.getItem('workspaceCode')
      if (!workspace) return
      const response = await api.get(`/active-theme?workspace=${workspace}`)
      setSelectedTheme(response.data.theme)
    } catch (error) {
      console.error('Error fetching theme:', error)
    }
  }

  const fetchPinnedMessage = async (ws) => {
    try {
      const workspace = ws || localStorage.getItem('workspaceCode')
      if (!workspace) return
      const response = await api.get(`/pinned-message?workspace=${workspace}`)
      setPinnedMessage(response.data.message || '')
      setPinnedEnabled(response.data.enabled || false)
    } catch (error) {
      console.error('Error fetching pinned message:', error)
    }
  }

  const handlePinnedMessageChange = async (message) => {
    setPinnedMessage(message)
    try {
      await api.post('/pinned-message', { message, workspace: workspaceCode })
    } catch (error) {
      console.error('Error saving pinned message:', error)
    }
  }

  const handlePinnedToggle = async () => {
    const newEnabled = !pinnedEnabled
    setPinnedEnabled(newEnabled)
    try {
      await api.post('/pinned-message', { enabled: newEnabled, workspace: workspaceCode })
      Swal.fire({
        icon: 'success',
        title: newEnabled ? 'הודעה נעוצה מופעלת' : 'הודעה נעוצה כבויה',
        showConfirmButton: false,
        timer: 1000
      })
    } catch (error) {
      console.error('Error toggling pinned message:', error)
    }
  }

  const handleThemeChange = async (themeId) => {
    try {
      setSelectedTheme(themeId)
      await api.post('/active-theme', { theme: themeId, workspace: workspaceCode })
      Swal.fire({
        icon: 'success',
        title: `הרקע שונה ל${THEMES[themeId].name}`,
        showConfirmButton: false,
        timer: 1000
      })
    } catch (error) {
      console.error('Error setting theme:', error)
    }
  }

  const fetchMessages = async (ws) => {
    try {
      const workspace = ws || localStorage.getItem('workspaceCode')
      if (!workspace) return
      const response = await api.get(`/messages?workspace=${workspace}`)
      setMessages(response.data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSend = {
        ...formData,
        displayDate: new Date().toISOString(),
        workspace: workspaceCode
      }

      if (editingId) {
        await api.put(`/messages/${editingId}`, dataToSend)
        setEditingId(null)
        Swal.fire({
          icon: 'success',
          title: 'ההודעה עודכנה בהצלחה!',
          showConfirmButton: false,
          timer: 1500
        })
      } else {
        // Create new message and set it as active
        const response = await api.post('/messages', dataToSend)
        await api.post('/active-message', { messageId: response.data.id, workspace: workspaceCode })
        Swal.fire({
          icon: 'success',
          title: 'ההודעה נשלחה!',
          text: 'ההודעה תוצג במסך התצוגה',
          showConfirmButton: false,
          timer: 1500
        })
      }

      setFormData({ subject: '', content: '' })
      fetchMessages()
    } catch (error) {
      console.error('Error saving message:', error)
      Swal.fire({
        icon: 'error',
        title: 'שגיאה!',
        text: 'אירעה שגיאה בשמירת ההודעה'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDisplayMessage = async (message) => {
    try {
      // Set active message on server - Display page will auto-update with alert
      await api.post('/active-message', { messageId: message.id, workspace: workspaceCode })
      Swal.fire({
        icon: 'success',
        title: 'ההודעה נשלחה למסך!',
        showConfirmButton: false,
        timer: 1000
      })
    } catch (error) {
      console.error('Error setting active message:', error)
      Swal.fire({
        icon: 'error',
        title: 'שגיאה!',
        text: 'אירעה שגיאה בהצגת ההודעה'
      })
    }
  }

  const handleEdit = (message) => {
    setEditingId(message.id)
    setFormData({
      subject: message.subject,
      content: message.content
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('האם למחוק את ההודעה?')) return

    try {
      await api.delete(`/messages/${id}?workspace=${workspaceCode}`)
      fetchMessages()
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ subject: '', content: '' })
  }

  return (
    <div className="input-page">
      {/* Animated background */}
      <div className="animated-bg">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="floating-heart"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          >
            ♥
          </div>
        ))}
      </div>

      <div className="input-container">
        <header className="input-header">
          <div className="header-content">
            <h1>{displayName}</h1>
            <div className="header-actions">
              <span className="workspace-badge">קוד: {workspaceCode}</span>
              <button className="logout-btn" onClick={async () => {
                // Notify server to disconnect TV
                try {
                  await api.post('/tv/disconnect', { workspaceCode })
                } catch (e) {}
                localStorage.removeItem('workspaceCode')
                localStorage.removeItem('displayName')
                localStorage.removeItem('user')
                navigate('/')
              }}>
                התנתק
              </button>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="message-form">
          <div className="form-group">
            <label>נושא ההודעה</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="הכנס נושא..."
              required
            />
          </div>

          <div className="form-group">
            <label>תוכן ההודעה</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="הכנס את תוכן ההודעה..."
              rows={4}
              required
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'שולח...' : editingId ? 'עדכן הודעה' : 'שלח הודעה'}
            </button>
            {editingId && (
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                ביטול
              </button>
            )}
          </div>
        </form>

        {/* Pinned Message Section */}
        <div className="pinned-message-section">
          <div className="pinned-header">
            <h2>📌 הודעה נעוצה</h2>
            <div className="pinned-toggle">
              <span className="toggle-label">{pinnedEnabled ? 'מוצג' : 'מוסתר'}</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={pinnedEnabled}
                  onChange={handlePinnedToggle}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          <textarea
            className="pinned-textarea"
            value={pinnedMessage}
            onChange={(e) => handlePinnedMessageChange(e.target.value)}
            placeholder="הכנס הודעה נעוצה שתוצג תמיד..."
            rows={3}
          />
          <p className="pinned-hint">ההודעה הנעוצה תוצג מתחת להודעה הראשית במסך התצוגה</p>
        </div>

        {/* Theme Selector */}
        <div className="theme-selector">
          <h2>בחר רקע למסך התצוגה</h2>

          {/* Animated themes */}
          <div className="theme-section">
            <h3>ערכות מונפשות</h3>
            <div className="theme-grid animated-themes">
              {Object.values(THEMES)
                .filter(theme => theme.category === 'animated')
                .map((theme) => (
                  <button
                    key={theme.id}
                    className={`theme-btn ${selectedTheme === theme.id ? 'active' : ''}`}
                    onClick={() => handleThemeChange(theme.id)}
                  >
                    <span className="theme-icon">{theme.icon}</span>
                    <span className="theme-name">{theme.name}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Solid color themes */}
          <div className="theme-section">
            <h3>צבעים בסיסיים</h3>
            <div className="theme-grid solid-themes">
              {Object.values(THEMES)
                .filter(theme => theme.category === 'solid')
                .map((theme) => (
                  <button
                    key={theme.id}
                    className={`theme-btn solid-btn ${selectedTheme === theme.id ? 'active' : ''}`}
                    onClick={() => handleThemeChange(theme.id)}
                    style={{ '--solid-color': theme.color }}
                  >
                    <span className="solid-preview" style={{ background: theme.color }}></span>
                    <span className="theme-name">{theme.name}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="messages-list">
          <h2>הודעות שנשלחו</h2>
          {messages.length === 0 ? (
            <p className="no-messages">אין הודעות עדיין</p>
          ) : (
            <ul>
              {messages.map((message, index) => (
                <li key={message.id} className="message-item">
                  <span className="message-number">{index + 1}</span>
                  <div className="message-info">
                    <strong>{message.subject}</strong>
                    <span className="message-date">
                      {new Date(message.display_date).toLocaleString('he-IL')}
                    </span>
                  </div>
                  <div className="message-actions">
                    <button
                      className="display-btn"
                      onClick={() => handleDisplayMessage(message)}
                    >
                      הצג
                    </button>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(message)}
                    >
                      ערוך
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(message.id)}
                    >
                      מחק
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="action-links">
          <a href="/display" className="view-display-link" target="_blank">
            📺 צפה בעמוד התצוגה
          </a>
          <a href="/qr" className="qr-link">
            📱 קודי QR לחיבור
          </a>
        </div>
      </div>
    </div>
  )
}

export default InputPage
