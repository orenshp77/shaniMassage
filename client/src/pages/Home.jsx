import { useState, useEffect } from 'react'
import api from '../services/api'

function Home() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/health')
        setMessage(response.data.message)
      } catch (error) {
        setMessage('לא ניתן להתחבר לשרת')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="container">
      <header style={{ textAlign: 'center', padding: '40px 0' }}>
        <h1>ברוכים הבאים ל-Shani System</h1>
        <p style={{ marginTop: '20px', fontSize: '18px' }}>
          {loading ? 'טוען...' : message}
        </p>
      </header>
    </div>
  )
}

export default Home
