const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const path = require('path')
const crypto = require('crypto')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

// Helper function to hash passwords
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Generate random 3-digit numeric code for workspace
const generateWorkspaceCode = () => {
  return Math.floor(100 + Math.random() * 900).toString()
}

const app = express()

// Middleware - CORS configuration for production
app.use(cors({
  origin: [
    'http://localhost:901',
    'http://localhost:3000',
    'https://shani-client.onrender.com',
    'https://aabb.co.il',
    'https://www.aabb.co.il',
    'http://aabb.co.il',
    'http://www.aabb.co.il'
  ],
  credentials: true
}))
app.use(express.json())

// PostgreSQL connection (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// In-memory storage for active workspaces (keyed by workspace_code)
const workspaces = {}

// In-memory storage for TV pairing codes (temporary, expires after 5 minutes)
const tvPairingCodes = {}

// Generate 3-digit numeric pairing code for TV
const generatePairingCode = () => {
  return Math.floor(100 + Math.random() * 900).toString()
}

// Get or create workspace state
const getWorkspace = (workspaceCode) => {
  if (!workspaces[workspaceCode]) {
    workspaces[workspaceCode] = {
      activeMessageId: null,
      activeTheme: 'hitech',
      lastExplicitChange: 0
    }
  }
  return workspaces[workspaceCode]
}

// Initialize database table
const initDB = async () => {
  try {
    // Drop old tables and recreate with new schema (one-time migration)
    // Check if users table has the workspace_code column
    const checkColumn = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'workspace_code'
    `)

    if (checkColumn.rows.length === 0) {
      // Old schema exists, need to migrate
      console.log('Migrating database to new schema...')
      await pool.query('DROP TABLE IF EXISTS settings CASCADE')
      await pool.query('DROP TABLE IF EXISTS messages CASCADE')
      await pool.query('DROP TABLE IF EXISTS users CASCADE')
      console.log('Old tables dropped')
    }

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        workspace_code VARCHAR(10) UNIQUE NOT NULL,
        input_pin VARCHAR(4) NOT NULL,
        display_pin VARCHAR(4) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create messages table with workspace_code
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        workspace_code VARCHAR(10) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        display_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create settings table for pinned message and other persistent settings (per workspace)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) NOT NULL,
        workspace_code VARCHAR(10) NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (key, workspace_code)
      )
    `)

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

// Routes

// ============ AUTH ROUTES ============

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, displayName, inputPin, displayPin } = req.body

    // Validate input
    if (!username || !password || !displayName || !inputPin || !displayPin) {
      return res.status(400).json({ error: 'כל השדות נדרשים' })
    }

    if (inputPin.length !== 4 || displayPin.length !== 4) {
      return res.status(400).json({ error: 'הסיסמאות חייבות להיות 4 ספרות' })
    }

    // Check if username already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username])
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'שם המשתמש כבר קיים' })
    }

    // Generate unique workspace code
    let workspaceCode
    let isUnique = false
    while (!isUnique) {
      workspaceCode = generateWorkspaceCode()
      const existing = await pool.query('SELECT id FROM users WHERE workspace_code = $1', [workspaceCode])
      if (existing.rows.length === 0) isUnique = true
    }

    // Hash password and create user
    const passwordHash = hashPassword(password)
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, display_name, workspace_code, input_pin, display_pin)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, display_name, workspace_code`,
      [username, passwordHash, displayName, workspaceCode, inputPin, displayPin]
    )

    // Initialize default settings for this workspace
    await pool.query(
      `INSERT INTO settings (key, workspace_code, value) VALUES ('pinned_message', $1, '')`,
      [workspaceCode]
    )
    await pool.query(
      `INSERT INTO settings (key, workspace_code, value) VALUES ('pinned_enabled', $1, 'false')`,
      [workspaceCode]
    )

    res.status(201).json({
      success: true,
      user: result.rows[0]
    })
  } catch (error) {
    console.error('Error registering user:', error)
    res.status(500).json({ error: 'שגיאה ביצירת המשתמש' })
  }
})

// Login with username/password
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body

    const passwordHash = hashPassword(password)
    const result = await pool.query(
      'SELECT id, username, display_name, workspace_code FROM users WHERE username = $1 AND password_hash = $2',
      [username, passwordHash]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' })
    }

    res.json({
      success: true,
      user: result.rows[0]
    })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({ error: 'שגיאה בהתחברות' })
  }
})

// Login with PIN (for input page)
app.post('/api/auth/pin-login', async (req, res) => {
  try {
    const { workspaceCode, pin, type } = req.body // type: 'input' or 'display'

    const pinColumn = type === 'input' ? 'input_pin' : 'display_pin'
    const result = await pool.query(
      `SELECT id, username, display_name, workspace_code FROM users WHERE workspace_code = $1 AND ${pinColumn} = $2`,
      [workspaceCode, pin]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'קוד או סיסמה שגויים' })
    }

    res.json({
      success: true,
      user: result.rows[0],
      accessType: type
    })
  } catch (error) {
    console.error('Error PIN login:', error)
    res.status(500).json({ error: 'שגיאה בהתחברות' })
  }
})

// Get user by workspace code (for QR code scanning)
app.get('/api/auth/workspace/:code', async (req, res) => {
  try {
    const { code } = req.params
    const result = await pool.query(
      'SELECT id, display_name, workspace_code FROM users WHERE workspace_code = $1',
      [code]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'קוד עבודה לא נמצא' })
    }

    res.json({
      success: true,
      workspace: result.rows[0]
    })
  } catch (error) {
    console.error('Error fetching workspace:', error)
    res.status(500).json({ error: 'שגיאה בטעינת מרחב העבודה' })
  }
})

// ============ MESSAGE ROUTES (with workspace) ============

// Get all messages for a workspace
app.get('/api/messages', async (req, res) => {
  try {
    const { workspace } = req.query
    if (!workspace) {
      return res.status(400).json({ error: 'workspace code is required' })
    }
    const result = await pool.query('SELECT * FROM messages WHERE workspace_code = $1 ORDER BY created_at DESC', [workspace])
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: 'שגיאה בטעינת ההודעות' })
  }
})

// Get latest message (for display page)
app.get('/api/messages/latest', async (req, res) => {
  try {
    const { workspace } = req.query
    if (!workspace) {
      return res.status(400).json({ error: 'workspace code is required' })
    }
    const result = await pool.query('SELECT * FROM messages WHERE workspace_code = $1 ORDER BY created_at DESC LIMIT 1', [workspace])
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
    const { subject, content, displayDate, workspace } = req.body
    if (!workspace) {
      return res.status(400).json({ error: 'workspace code is required' })
    }
    const result = await pool.query(
      'INSERT INTO messages (workspace_code, subject, content, display_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [workspace, subject, content, displayDate]
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
    const { workspace } = req.query
    const deletedId = parseInt(id)

    const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING *', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'הודעה לא נמצאה' })
    }

    // If deleted message was the active one, silently switch to next available
    if (workspace) {
      const ws = getWorkspace(workspace)
      if (ws.activeMessageId === deletedId) {
        const nextMessage = await pool.query('SELECT id FROM messages WHERE workspace_code = $1 ORDER BY created_at DESC LIMIT 1', [workspace])
        ws.activeMessageId = nextMessage.rows[0]?.id || null
      }
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

// ============ ADMIN ROUTES ============

// Admin: Get all users
app.get('/api/admin/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, display_name, workspace_code, input_pin, display_pin, created_at FROM users ORDER BY created_at DESC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'שגיאה בטעינת המשתמשים' })
  }
})

// Admin: Delete user
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Get user workspace code first
    const userResult = await pool.query('SELECT workspace_code FROM users WHERE id = $1', [id])
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'משתמש לא נמצא' })
    }

    const workspaceCode = userResult.rows[0].workspace_code

    // Delete user's settings, messages, then the user
    await pool.query('DELETE FROM settings WHERE workspace_code = $1', [workspaceCode])
    await pool.query('DELETE FROM messages WHERE workspace_code = $1', [workspaceCode])
    await pool.query('DELETE FROM users WHERE id = $1', [id])

    res.json({ success: true, message: 'המשתמש נמחק בהצלחה' })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'שגיאה במחיקת המשתמש' })
  }
})

// Admin: Update user password
app.put('/api/admin/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params
    const { password } = req.body

    if (!password || password.length < 1) {
      return res.status(400).json({ error: 'סיסמה נדרשת' })
    }

    const passwordHash = hashPassword(password)
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username, display_name',
      [passwordHash, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'משתמש לא נמצא' })
    }

    res.json({ success: true, message: 'הסיסמה עודכנה בהצלחה' })
  } catch (error) {
    console.error('Error updating password:', error)
    res.status(500).json({ error: 'שגיאה בעדכון הסיסמה' })
  }
})

// Admin: Update user PINs
app.put('/api/admin/users/:id/pins', async (req, res) => {
  try {
    const { id } = req.params
    const { inputPin, displayPin } = req.body

    if (inputPin && inputPin.length !== 4) {
      return res.status(400).json({ error: 'PIN לניהול חייב להיות 4 ספרות' })
    }
    if (displayPin && displayPin.length !== 4) {
      return res.status(400).json({ error: 'PIN למסך חייב להיות 4 ספרות' })
    }

    let query = 'UPDATE users SET '
    const values = []
    const updates = []

    if (inputPin) {
      values.push(inputPin)
      updates.push(`input_pin = $${values.length}`)
    }
    if (displayPin) {
      values.push(displayPin)
      updates.push(`display_pin = $${values.length}`)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'לא סופקו ערכים לעדכון' })
    }

    values.push(id)
    query += updates.join(', ') + ` WHERE id = $${values.length} RETURNING id, username`

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'משתמש לא נמצא' })
    }

    res.json({ success: true, message: 'קודי PIN עודכנו בהצלחה' })
  } catch (error) {
    console.error('Error updating PINs:', error)
    res.status(500).json({ error: 'שגיאה בעדכון קודי PIN' })
  }
})

// Admin: Login as user (get their workspace access)
app.post('/api/admin/login-as/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'SELECT id, username, display_name, workspace_code FROM users WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'משתמש לא נמצא' })
    }

    res.json({
      success: true,
      user: result.rows[0]
    })
  } catch (error) {
    console.error('Error logging in as user:', error)
    res.status(500).json({ error: 'שגיאה בכניסה כמשתמש' })
  }
})

// Admin: Clear all data
app.delete('/api/admin/clear-all', async (req, res) => {
  try {
    await pool.query('DELETE FROM settings')
    await pool.query('DELETE FROM messages')
    await pool.query('DELETE FROM users')
    res.json({ success: true, message: 'All data cleared' })
  } catch (error) {
    console.error('Error clearing data:', error)
    res.status(500).json({ error: 'שגיאה במחיקת הנתונים' })
  }
})

// Admin: Reset database (drop and recreate tables)
app.post('/api/admin/reset-db', async (req, res) => {
  try {
    console.log('Resetting database...')
    await pool.query('DROP TABLE IF EXISTS settings CASCADE')
    await pool.query('DROP TABLE IF EXISTS messages CASCADE')
    await pool.query('DROP TABLE IF EXISTS users CASCADE')

    // Recreate tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        workspace_code VARCHAR(10) UNIQUE NOT NULL,
        input_pin VARCHAR(4) NOT NULL,
        display_pin VARCHAR(4) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        workspace_code VARCHAR(10) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        display_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) NOT NULL,
        workspace_code VARCHAR(10) NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (key, workspace_code)
      )
    `)

    console.log('Database reset complete!')
    res.json({ success: true, message: 'Database reset complete' })
  } catch (error) {
    console.error('Error resetting database:', error)
    res.status(500).json({ error: 'שגיאה באיפוס הדאטאבייס' })
  }
})

// ============ TV PAIRING ROUTES ============

// Generate a new TV pairing code
app.post('/api/tv/generate-code', (req, res) => {
  try {
    // Clean up expired codes (older than 5 minutes)
    const now = Date.now()
    for (const code in tvPairingCodes) {
      if (now - tvPairingCodes[code].createdAt > 5 * 60 * 1000) {
        delete tvPairingCodes[code]
      }
    }

    // Generate unique code
    let pairingCode
    do {
      pairingCode = generatePairingCode()
    } while (tvPairingCodes[pairingCode])

    // Store pairing code
    tvPairingCodes[pairingCode] = {
      createdAt: now,
      paired: false,
      workspaceCode: null,
      displayName: null
    }

    res.json({ pairingCode })
  } catch (error) {
    console.error('Error generating pairing code:', error)
    res.status(500).json({ error: 'שגיאה ביצירת קוד צימוד' })
  }
})

// Check if TV has been paired (polled by TV)
app.get('/api/tv/check-pairing/:code', (req, res) => {
  try {
    const { code } = req.params
    const pairing = tvPairingCodes[code]

    if (!pairing) {
      return res.status(404).json({ error: 'קוד לא נמצא' })
    }

    if (pairing.paired) {
      // Clean up after successful pairing
      const result = {
        paired: true,
        workspaceCode: pairing.workspaceCode,
        displayName: pairing.displayName
      }
      delete tvPairingCodes[code]
      return res.json(result)
    }

    res.json({ paired: false })
  } catch (error) {
    console.error('Error checking pairing:', error)
    res.status(500).json({ error: 'שגיאה בבדיקת צימוד' })
  }
})

// Pair TV with workspace (called from phone after scanning QR)
app.post('/api/tv/pair', async (req, res) => {
  try {
    const { pairingCode, workspaceCode } = req.body

    if (!pairingCode || !workspaceCode) {
      return res.status(400).json({ error: 'קוד צימוד וקוד עבודה נדרשים' })
    }

    const pairing = tvPairingCodes[pairingCode]
    if (!pairing) {
      return res.status(404).json({ error: 'קוד צימוד לא נמצא או פג תוקף' })
    }

    // Get workspace display name
    const userResult = await pool.query(
      'SELECT display_name FROM users WHERE workspace_code = $1',
      [workspaceCode]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'מרחב עבודה לא נמצא' })
    }

    // Mark as paired
    pairing.paired = true
    pairing.workspaceCode = workspaceCode
    pairing.displayName = userResult.rows[0].display_name

    // Mark workspace as having TV connected
    const ws = getWorkspace(workspaceCode)
    ws.tvConnected = true
    ws.tvConnectedAt = Date.now()

    res.json({
      success: true,
      message: 'הטלוויזיה צומדה בהצלחה!',
      displayName: pairing.displayName
    })
  } catch (error) {
    console.error('Error pairing TV:', error)
    res.status(500).json({ error: 'שגיאה בצימוד הטלוויזיה' })
  }
})

// Check if TV is connected to workspace
app.get('/api/tv/status', async (req, res) => {
  try {
    const { workspace } = req.query
    if (!workspace) {
      return res.status(400).json({ error: 'workspace code is required' })
    }
    const ws = getWorkspace(workspace)
    res.json({
      connected: ws.tvConnected || false,
      connectedAt: ws.tvConnectedAt || null
    })
  } catch (error) {
    console.error('Error checking TV status:', error)
    res.status(500).json({ error: 'שגיאה בבדיקת סטטוס טלוויזיה' })
  }
})

// Disconnect TV (called when user logs out)
app.post('/api/tv/disconnect', async (req, res) => {
  try {
    const { workspaceCode } = req.body
    if (!workspaceCode) {
      return res.status(400).json({ error: 'workspace code is required' })
    }
    const ws = getWorkspace(workspaceCode)
    ws.disconnected = true
    ws.disconnectedAt = Date.now()
    ws.tvConnected = false  // Mark TV as disconnected
    res.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting TV:', error)
    res.status(500).json({ error: 'שגיאה בניתוק הטלוויזיה' })
  }
})

// Check if workspace is disconnected (TV polls this)
app.get('/api/tv/check-disconnect', async (req, res) => {
  try {
    const { workspace } = req.query
    if (!workspace) {
      return res.status(400).json({ error: 'workspace code is required' })
    }
    const ws = getWorkspace(workspace)
    const disconnected = ws.disconnected || false
    // Reset the flag after checking
    if (disconnected) {
      ws.disconnected = false
    }
    res.json({ disconnected })
  } catch (error) {
    console.error('Error checking disconnect:', error)
    res.status(500).json({ error: 'שגיאה בבדיקת ניתוק' })
  }
})

// Set active message (for display page) - with workspace
app.post('/api/active-message', async (req, res) => {
  try {
    const { messageId, workspace } = req.body
    if (!workspace) {
      return res.status(400).json({ error: 'workspace code is required' })
    }
    const ws = getWorkspace(workspace)
    ws.activeMessageId = messageId
    ws.lastExplicitChange = Date.now() // Mark this as an explicit change (triggers alert)
    res.json({ success: true, activeMessageId: ws.activeMessageId })
  } catch (error) {
    console.error('Error setting active message:', error)
    res.status(500).json({ error: 'שגיאה בהגדרת ההודעה הפעילה' })
  }
})

// Get active message (for display page polling) - with workspace
app.get('/api/active-message', async (req, res) => {
  try {
    const { workspace } = req.query
    if (!workspace) {
      return res.status(400).json({ error: 'workspace code is required' })
    }

    const ws = getWorkspace(workspace)
    let message = null

    if (!ws.activeMessageId) {
      // If no active message, return latest
      const result = await pool.query('SELECT * FROM messages WHERE workspace_code = $1 ORDER BY created_at DESC LIMIT 1', [workspace])
      message = result.rows[0] || null
      // Update activeMessageId silently so we track current message
      if (message) {
        ws.activeMessageId = message.id
      }
    } else {
      const result = await pool.query('SELECT * FROM messages WHERE id = $1 AND workspace_code = $2', [ws.activeMessageId, workspace])
      if (result.rows.length === 0) {
        // If active message was deleted, return latest
        ws.activeMessageId = null
        const latestResult = await pool.query('SELECT * FROM messages WHERE workspace_code = $1 ORDER BY created_at DESC LIMIT 1', [workspace])
        message = latestResult.rows[0] || null
        if (message) {
          ws.activeMessageId = message.id
        }
      } else {
        message = result.rows[0]
      }
    }

    // Get pinned message from database for this workspace
    const pinnedMessageResult = await pool.query("SELECT value FROM settings WHERE key = 'pinned_message' AND workspace_code = $1", [workspace])
    const pinnedEnabledResult = await pool.query("SELECT value FROM settings WHERE key = 'pinned_enabled' AND workspace_code = $1", [workspace])

    // Return message with theme, activeMessageId, lastExplicitChange, and pinned message
    res.json({
      message,
      theme: ws.activeTheme,
      activeMessageId: ws.activeMessageId,
      lastExplicitChange: ws.lastExplicitChange,
      pinnedMessage: pinnedMessageResult.rows[0]?.value || '',
      pinnedMessageEnabled: pinnedEnabledResult.rows[0]?.value === 'true'
    })
  } catch (error) {
    console.error('Error fetching active message:', error)
    res.status(500).json({ error: 'שגיאה בטעינת ההודעה הפעילה' })
  }
})

// Set active theme - with workspace
app.post('/api/active-theme', (req, res) => {
  try {
    const { theme, workspace } = req.body
    if (!workspace) {
      return res.status(400).json({ error: 'workspace code is required' })
    }
    const ws = getWorkspace(workspace)
    ws.activeTheme = theme
    res.json({ success: true, theme: ws.activeTheme })
  } catch (error) {
    console.error('Error setting active theme:', error)
    res.status(500).json({ error: 'שגיאה בהגדרת הנושא' })
  }
})

// Get active theme - with workspace
app.get('/api/active-theme', (req, res) => {
  const { workspace } = req.query
  if (!workspace) {
    return res.status(400).json({ error: 'workspace code is required' })
  }
  const ws = getWorkspace(workspace)
  res.json({ theme: ws.activeTheme })
})

// Get pinned message - with workspace
app.get('/api/pinned-message', async (req, res) => {
  try {
    const { workspace } = req.query
    if (!workspace) {
      return res.status(400).json({ error: 'workspace code is required' })
    }

    const messageResult = await pool.query("SELECT value FROM settings WHERE key = 'pinned_message' AND workspace_code = $1", [workspace])
    const enabledResult = await pool.query("SELECT value FROM settings WHERE key = 'pinned_enabled' AND workspace_code = $1", [workspace])

    res.json({
      message: messageResult.rows[0]?.value || '',
      enabled: enabledResult.rows[0]?.value === 'true'
    })
  } catch (error) {
    console.error('Error fetching pinned message:', error)
    res.status(500).json({ error: 'שגיאה בטעינת ההודעה הנעוצה' })
  }
})

// Set pinned message - with workspace
app.post('/api/pinned-message', async (req, res) => {
  try {
    const { message, enabled, workspace } = req.body
    if (!workspace) {
      return res.status(400).json({ error: 'workspace code is required' })
    }

    if (message !== undefined) {
      await pool.query(
        "INSERT INTO settings (key, workspace_code, value, updated_at) VALUES ('pinned_message', $1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key, workspace_code) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP",
        [workspace, message]
      )
    }
    if (enabled !== undefined) {
      await pool.query(
        "INSERT INTO settings (key, workspace_code, value, updated_at) VALUES ('pinned_enabled', $1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key, workspace_code) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP",
        [workspace, enabled.toString()]
      )
    }

    // Get current values
    const messageResult = await pool.query("SELECT value FROM settings WHERE key = 'pinned_message' AND workspace_code = $1", [workspace])
    const enabledResult = await pool.query("SELECT value FROM settings WHERE key = 'pinned_enabled' AND workspace_code = $1", [workspace])

    res.json({
      success: true,
      message: messageResult.rows[0]?.value || '',
      enabled: enabledResult.rows[0]?.value === 'true'
    })
  } catch (error) {
    console.error('Error setting pinned message:', error)
    res.status(500).json({ error: 'שגיאה בהגדרת ההודעה הנעוצה' })
  }
})

const PORT = process.env.PORT || 5000

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
