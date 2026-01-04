import { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'
import api from '../services/api'
import AnimatedBackground from '../components/AnimatedBackgrounds'
import './DisplayPage.css'

// Bell sound URL
const BELL_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'

function DisplayPage() {
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTheme, setCurrentTheme] = useState('hitech')
  const [pinnedMessage, setPinnedMessage] = useState('')
  const [pinnedEnabled, setPinnedEnabled] = useState(false)
  const lastMessageId = useRef(null)
  const lastExplicitChangeRef = useRef(0) // Track last explicit change timestamp from server
  const audioRef = useRef(null)
  const audioUnlocked = useRef(false)

  // Unlock audio on any user interaction (runs silently in background)
  const unlockAudio = () => {
    if (!audioUnlocked.current && audioRef.current) {
      audioRef.current.volume = 0
      audioRef.current.play().then(() => {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.volume = 0.8
        audioUnlocked.current = true
      }).catch(() => {})
    }
  }

  // Play bell sound
  const playBellSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
    } catch (e) {
      // Silent fail
    }
  }

  // Show incoming message alert using SweetAlert2
  const showIncomingAlert = (newMessage) => {
    playBellSound()

    Swal.fire({
      title: 'הודעה נכנסת!',
      html: `<div class="swal-incoming-content">
        <div class="swal-bell-icon">🔔</div>
        <p class="swal-alert-subject">${newMessage.subject}</p>
      </div>`,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      customClass: {
        popup: 'swal-incoming-popup'
      }
    })
  }

  const fetchMessage = async () => {
    try {
      const response = await api.get('/active-message')
      const { message: newMessage, theme, lastExplicitChange, pinnedMessage: serverPinnedMessage, pinnedMessageEnabled } = response.data

      // Update theme if changed
      if (theme && theme !== currentTheme) {
        setCurrentTheme(theme)
      }

      // Update pinned message
      setPinnedMessage(serverPinnedMessage || '')
      setPinnedEnabled(pinnedMessageEnabled || false)

      // Only show alert if there was an explicit change (someone pressed "הצג" or sent new message)
      // This won't trigger on deletions since those don't update lastExplicitChange
      const hasNewExplicitChange = lastExplicitChange > lastExplicitChangeRef.current &&
        lastExplicitChangeRef.current > 0 // Not on first load

      if (hasNewExplicitChange && newMessage) {
        showIncomingAlert(newMessage)
      }

      // Update tracking refs
      lastExplicitChangeRef.current = lastExplicitChange
      if (newMessage) {
        lastMessageId.current = newMessage.id
      } else {
        lastMessageId.current = null
      }

      setMessage(newMessage)
    } catch (error) {
      console.error('Error fetching message:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio(BELL_SOUND_URL)
    audioRef.current.volume = 0.8

    fetchMessage()

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchMessage, 2000)
    return () => clearInterval(interval)
  }, [])

  // Calculate dynamic font size for subject based on text length
  const getSubjectFontSize = (length) => {
    if (length <= 15) return '5rem'
    if (length <= 25) return '4rem'
    if (length <= 40) return '3.5rem'
    if (length <= 60) return '3rem'
    if (length <= 80) return '2.5rem'
    return '2rem'
  }

  // Calculate dynamic font size for content based on text length
  // Uses clamp() for responsive sizing across different screen sizes
  const getContentFontSize = (length) => {
    if (length <= 50) return 'clamp(2rem, 4vw, 3.5rem)'
    if (length <= 100) return 'clamp(1.8rem, 3.5vw, 3rem)'
    if (length <= 200) return 'clamp(1.5rem, 3vw, 2.5rem)'
    if (length <= 400) return 'clamp(1.3rem, 2.5vw, 2rem)'
    if (length <= 600) return 'clamp(1.2rem, 2vw, 1.8rem)'
    return 'clamp(1rem, 1.8vw, 1.5rem)'
  }

  // Calculate dynamic font size for pinned message (smaller than content)
  const getPinnedFontSize = (length) => {
    if (length <= 30) return 'clamp(1.3rem, 2.5vw, 2rem)'
    if (length <= 60) return 'clamp(1.2rem, 2.2vw, 1.8rem)'
    if (length <= 100) return 'clamp(1.1rem, 2vw, 1.5rem)'
    if (length <= 150) return 'clamp(1rem, 1.8vw, 1.3rem)'
    return 'clamp(0.9rem, 1.5vw, 1.2rem)'
  }

  if (loading) {
    return (
      <div className="display-page">
        <div className="loading-screen">
          <div className="loader"></div>
          <p>טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="display-page" onClick={unlockAudio} onMouseMove={unlockAudio} onKeyDown={unlockAudio}>
      {/* Animated Theme Background */}
      <AnimatedBackground theme={currentTheme} />

      {/* Content */}
      <div className="display-content">
        {/* Logo */}
        <div className="logo-container">
          <div className="logo">
            <span className="logo-text">מוקד עידכונים</span>
          </div>
        </div>

        {message ? (
          <div className="message-display">
            <h1
              className="message-subject"
              style={{ fontSize: getSubjectFontSize(message.subject.length) }}
            >
              {message.subject}
            </h1>
            <div className="message-content-box">
              <p
                className="message-content"
                style={{ fontSize: getContentFontSize(message.content.length) }}
              >
                {message.content}
              </p>
            </div>
            {/* Pinned Message */}
            {pinnedEnabled && pinnedMessage && (
              <div className="pinned-message-display">
                <p
                  className="pinned-content"
                  style={{ fontSize: getPinnedFontSize(pinnedMessage.length) }}
                >
                  {pinnedMessage}
                </p>
              </div>
            )}
            {/* Date/Time - Smaller size */}
            <div className="message-datetime compact">
              <div className="date-box">
                <span className="date-icon">📅</span>
                <span className="date-text"><CurrentDate /></span>
              </div>
              <div className="time-box">
                <span className="time-icon">🕐</span>
                <span className="time-text"><CurrentTimeDisplay /></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-message">
            {/* Show pinned message even when no regular messages */}
            {pinnedEnabled && pinnedMessage ? (
              <>
                <div className="pinned-message-display standalone">
                  <p
                    className="pinned-content"
                    style={{ fontSize: getPinnedFontSize(pinnedMessage.length) }}
                  >
                    {pinnedMessage}
                  </p>
                </div>
                <div className="message-datetime compact">
                  <div className="date-box">
                    <span className="date-icon">📅</span>
                    <span className="date-text"><CurrentDate /></span>
                  </div>
                  <div className="time-box">
                    <span className="time-icon">🕐</span>
                    <span className="time-text"><CurrentTimeDisplay /></span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1>אין הודעות להצגה</h1>
                <p>הוסף הודעה חדשה דרך עמוד הניהול</p>
              </>
            )}
          </div>
        )}

        {/* Footer time */}
        <div className="current-time">
          <CurrentTime />
        </div>
      </div>
    </div>
  )
}

function CurrentTime() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <span>
      {time.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

function CurrentDate() {
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <span>
      {date.toLocaleDateString('he-IL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    </span>
  )
}

function CurrentTimeDisplay() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <span>
      {time.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

export default DisplayPage
