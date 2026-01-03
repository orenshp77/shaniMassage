const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// PostgreSQL connection (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Active message ID (in-memory for real-time display)
let activeMessageId = null

// Initialize database table
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        display_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

// Routes

// Get all messages
app.get('/api/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: 'שגיאה בטעינת ההודעות' })
  }
})

// Get latest message (for display page)
app.get('/api/messages/latest', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 1')
    res.json(result.rows[0] || null)
  } catch (error) {
    console.error('Error fetching latest message:', error)
    res.status(500).json({ error: 'שגיאה בטעינת ההודעה' })
  }
})

// Get single message by ID
app.get('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM messages WHERE id = $1', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'הודעה לא נמצאה' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching message:', error)
    res.status(500).json({ error: 'שגיאה בטעינת ההודעה' })
  }
})

// Create message
app.post('/api/messages', async (req, res) => {
  try {
    const { subject, content, displayDate } = req.body
    const result = await pool.query(
      'INSERT INTO messages (subject, content, display_date) VALUES ($1, $2, $3) RETURNING *',
      [subject, content, displayDate]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating message:', error)
    res.status(500).json({ error: 'שגיאה ביצירת ההודעה' })
  }
})

// Update message
app.put('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { subject, content, displayDate } = req.body
    const result = await pool.query(
      'UPDATE messages SET subject = $1, content = $2, display_date = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [subject, content, displayDate, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'הודעה לא נמצאה' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating message:', error)
    res.status(500).json({ error: 'שגיאה בעדכון ההודעה' })
  }
})

// Delete message
app.delete('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING *', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'הודעה לא נמצאה' })
    }
    res.json({ message: 'ההודעה נמחקה בהצלחה' })
  } catch (error) {
    console.error('Error deleting message:', error)
    res.status(500).json({ error: 'שגיאה במחיקת ההודעה' })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'השרת פועל!' })
})

// Set active message (for display page)
app.post('/api/active-message', async (req, res) => {
  try {
    const { messageId } = req.body
    activeMessageId = messageId
    res.json({ success: true, activeMessageId })
  } catch (error) {
    console.error('Error setting active message:', error)
    res.status(500).json({ error: 'שגיאה בהגדרת ההודעה הפעילה' })
  }
})

// Get active message (for display page polling)
app.get('/api/active-message', async (req, res) => {
  try {
    if (!activeMessageId) {
      // If no active message, return latest
      const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 1')
      return res.json(result.rows[0] || null)
    }

    const result = await pool.query('SELECT * FROM messages WHERE id = $1', [activeMessageId])
    if (result.rows.length === 0) {
      // If active message was deleted, return latest
      activeMessageId = null
      const latestResult = await pool.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 1')
      return res.json(latestResult.rows[0] || null)
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching active message:', error)
    res.status(500).json({ error: 'שגיאה בטעינת ההודעה הפעילה' })
  }
})

const PORT = process.env.PORT || 5000

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
