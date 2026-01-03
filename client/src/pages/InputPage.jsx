import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import api from '../services/api'
import './InputPage.css'

function InputPage() {
  const [messages, setMessages] = useState([])
  const [formData, setFormData] = useState({
    subject: '',
    content: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await api.get('/messages')
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
        displayDate: new Date().toISOString()
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
        await api.post('/active-message', { messageId: response.data.id })
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
      await api.post('/active-message', { messageId: message.id })
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
      await api.delete(`/messages/${id}`)
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
          <h1>מוקד עידכונים</h1>
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
