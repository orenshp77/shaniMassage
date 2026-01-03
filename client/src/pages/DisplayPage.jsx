import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import './DisplayPage.css'

// Bell sound URL
const BELL_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'

function DisplayPage() {
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alertData, setAlertData] = useState(null)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const lastMessageId = useRef(null)
  const audioRef = useRef(null)

  // Enable audio (must be called on user interaction)
  const enableAudio = () => {
    if (!audioEnabled && audioRef.current) {
      // Play silent to unlock audio
      audioRef.current.volume = 0
      audioRef.current.play().then(() => {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.volume = 0.8
        setAudioEnabled(true)
      }).catch(e => console.log('Audio unlock failed:', e))
    }
  }

  // Play bell sound
  const playBellSound = () => {
    try {
      if (audioRef.current && audioEnabled) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(e => console.log('Audio play failed:', e))
      }
    } catch (e) {
      console.log('Audio error:', e)
    }
  }

  // Show incoming message alert
  const showIncomingAlert = (newMessage) => {
    setAlertData(newMessage)
    playBellSound()

    // Hide after 2 seconds
    setTimeout(() => {
      setAlertData(null)
    }, 2000)
  }

  const fetchMessage = async () => {
    // Don't fetch while showing alert
    if (alertData) return

    try {
      const response = await api.get('/active-message')
      const newMessage = response.data

      // Check if message changed - show alert
      if (newMessage && lastMessageId.current !== null && lastMessageId.current !== newMessage.id) {
        showIncomingAlert(newMessage)
      }

      if (newMessage) {
        lastMessageId.current = newMessage.id
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
  const getContentFontSize = (length) => {
    if (length <= 50) return '3rem'
    if (length <= 100) return '2.5rem'
    if (length <= 200) return '2rem'
    if (length <= 400) return '1.6rem'
    if (length <= 600) return '1.4rem'
    return '1.2rem'
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
    <div className="display-page" onClick={enableAudio}>
      {/* Audio Enable Button - Shows until user clicks */}
      {!audioEnabled && (
        <div className="audio-enable-overlay" onClick={enableAudio}>
          <div className="audio-enable-box">
            <span className="audio-icon">🔊</span>
            <p>לחץ להפעלת צלילים</p>
          </div>
        </div>
      )}

      {/* Custom Alert Overlay - Shows for 2 seconds when new message arrives */}
      {alertData && (
        <div className="custom-alert-overlay">
          <div className="custom-alert-box">
            <div className="bell-icon">🔔</div>
            <h1>הודעה נכנסת!</h1>
            <p className="alert-subject">{alertData.subject}</p>
          </div>
        </div>
      )}

      {/* Animated background particles */}
      <div className="particles">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="gradient-overlay"></div>

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
            <div className="message-datetime">
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
            <h1>אין הודעות להצגה</h1>
            <p>הוסף הודעה חדשה דרך עמוד הניהול</p>
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
