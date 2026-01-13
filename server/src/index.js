const express = require('express')
const cors = require('cors')
const path = require('path')
const crypto = require('crypto')
const admin = require('firebase-admin')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

// Initialize Firebase Admin SDK
// Handle private key - try JSON parse first, then replace \n
let privateKey = process.env.FIREBASE_PRIVATE_KEY
if (privateKey) {
  try {
    // If the key is wrapped in quotes (from Render), parse it
    if (privateKey.startsWith('"')) {
      privateKey = JSON.parse(privateKey)
    }
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n')
  } catch (e) {
    console.error('Error parsing private key:', e.message)
    privateKey = privateKey.replace(/\\n/g, '\n')
  }
}

const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: privateKey,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CERT_URL
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

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
    'https://shani-massage-client.onrender.com',
    'https://aabb.co.il',
    'https://www.aabb.co.il',
    'http://aabb.co.il',
    'http://www.aabb.co.il'
  ],
  credentials: true
}))
app.use(express.json({ limit: '5mb' }))

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

// Routes

// ============ AUTH ROUTES ============

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body

    // Validate input
    if (!username) {
      return res.status(400).json({ error: 'נא להזין שם משתמש' })
    }
    if (!password) {
      return res.status(400).json({ error: 'נא להזין סיסמה' })
    }
    if (!displayName) {
      return res.status(400).json({ error: 'נא להזין שם תצוגה' })
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 4 תווים' })
    }

    // Check if username already exists
    const usersRef = db.collection('users')
    const existingUser = await usersRef.where('username', '==', username).get()
    if (!existingUser.empty) {
      return res.status(400).json({ error: 'שם המשתמש כבר קיים במערכת, נסה שם אחר' })
    }

    // Generate unique workspace code
    let workspaceCode
    let isUnique = false
    while (!isUnique) {
      workspaceCode = generateWorkspaceCode()
      const existing = await usersRef.where('workspace_code', '==', workspaceCode).get()
      if (existing.empty) isUnique = true
    }

    // Hash password and create user (with default PINs)
    const passwordHash = hashPassword(password)
    const defaultPin = '1111'
    const userDoc = await usersRef.add({
      username,
      password_hash: passwordHash,
      display_name: displayName,
      workspace_code: workspaceCode,
      input_pin: defaultPin,
      display_pin: defaultPin,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    })

    // Initialize default settings for this workspace
    const settingsRef = db.collection('settings')
    await settingsRef.doc(`pinned_message_${workspaceCode}`).set({
      key: 'pinned_message',
      workspace_code: workspaceCode,
      value: '',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    })
    await settingsRef.doc(`pinned_enabled_${workspaceCode}`).set({
      key: 'pinned_enabled',
      workspace_code: workspaceCode,
      value: 'false',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    })

    res.status(201).json({
      success: true,
      user: {
        id: userDoc.id,
        username,
        display_name: displayName,
        workspace_code: workspaceCode
      }
    })
  } catch (error) {
    console.error('Error registering user:', error.message)
    console.error('Error details:', error)
    res.status(500).json({ error: 'בעיה בחיבור למערכת, נסה שוב מאוחר יותר' })
  }
})

// Login with username/password
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'נא להזין שם משתמש וסיסמה' })
    }

    // First check if user exists
    const usersRef = db.collection('users')
    const userSnapshot = await usersRef.where('username', '==', username).get()
    if (userSnapshot.empty) {
      return res.status(401).json({ error: 'שם משתמש לא קיים במערכת' })
    }

    const passwordHash = hashPassword(password)
    const userDoc = userSnapshot.docs[0]
    const userData = userDoc.data()

    if (userData.password_hash !== passwordHash) {
      return res.status(401).json({ error: 'סיסמה שגויה, נסה שוב' })
    }

    res.json({
      success: true,
      user: {
        id: userDoc.id,
        username: userData.username,
        display_name: userData.display_name,
        workspace_code: userData.workspace_code
      }
    })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({ error: 'בעיה בחיבור למערכת, נסה שוב מאוחר יותר' })
  }
})

// Login with PIN (for input page)
app.post('/api/auth/pin-login', async (req, res) => {
  try {
    const { workspaceCode, pin, type } = req.body // type: 'input' or 'display'

    if (!workspaceCode || !pin) {
      return res.status(400).json({ error: 'נא להזין קוד עבודה וקוד PIN' })
    }

    // First check if workspace exists
    const usersRef = db.collection('users')
    const workspaceSnapshot = await usersRef.where('workspace_code', '==', workspaceCode).get()
    if (workspaceSnapshot.empty) {
      return res.status(401).json({ error: 'קוד עבודה לא קיים במערכת' })
    }

    const userDoc = workspaceSnapshot.docs[0]
    const userData = userDoc.data()
    const pinField = type === 'input' ? 'input_pin' : 'display_pin'

    if (userData[pinField] !== pin) {
      return res.status(401).json({ error: 'קוד PIN שגוי, נסה שוב' })
    }

    res.json({
      success: true,
      user: {
        id: userDoc.id,
        username: userData.username,
        display_name: userData.display_name,
        workspace_code: userData.workspace_code
      },
      accessType: type
    })
  } catch (error) {
    console.error('Error PIN login:', error)
    res.status(500).json({ error: 'בעיה בחיבור למערכת, נסה שוב מאוחר יותר' })
  }
})

// Get user by workspace code (for QR code scanning)
app.get('/api/auth/workspace/:code', async (req, res) => {
  try {
    const { code } = req.params

    if (!code) {
      return res.status(400).json({ error: 'נא להזין קוד עבודה' })
    }

    const usersRef = db.collection('users')
    const snapshot = await usersRef.where('workspace_code', '==', code).get()

    if (snapshot.empty) {
      return res.status(404).json({ error: 'קוד עבודה לא נמצא במערכת' })
    }

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()

    res.json({
      success: true,
      workspace: {
        id: userDoc.id,
        display_name: userData.display_name,
        workspace_code: userData.workspace_code
      }
    })
  } catch (error) {
    console.error('Error fetching workspace:', error)
    res.status(500).json({ error: 'בעיה בחיבור למערכת, נסה שוב מאוחר יותר' })
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
    const messagesRef = db.collection('messages')
    const snapshot = await messagesRef
      .where('workspace_code', '==', workspace)
      .orderBy('created_at', 'desc')
      .get()

    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || doc.data().created_at,
      updated_at: doc.data().updated_at?.toDate?.() || doc.data().updated_at,
      display_date: doc.data().display_date?.toDate?.() || doc.data().display_date
    }))

    res.json(messages)
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
    const messagesRef = db.collection('messages')
    const snapshot = await messagesRef
      .where('workspace_code', '==', workspace)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get()

    if (snapshot.empty) {
      return res.json(null)
    }

    const doc = snapshot.docs[0]
    res.json({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || doc.data().created_at,
      updated_at: doc.data().updated_at?.toDate?.() || doc.data().updated_at,
      display_date: doc.data().display_date?.toDate?.() || doc.data().display_date
    })
  } catch (error) {
    console.error('Error fetching latest message:', error)
    res.status(500).json({ error: 'שגיאה בטעינת ההודעה' })
  }
})

// Get single message by ID
app.get('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params
    const doc = await db.collection('messages').doc(id).get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'הודעה לא נמצאה' })
    }

    res.json({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || doc.data().created_at,
      updated_at: doc.data().updated_at?.toDate?.() || doc.data().updated_at,
      display_date: doc.data().display_date?.toDate?.() || doc.data().display_date
    })
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

    const messagesRef = db.collection('messages')
    const docRef = await messagesRef.add({
      workspace_code: workspace,
      subject,
      content,
      display_date: new Date(displayDate),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    })

    const newDoc = await docRef.get()
    res.status(201).json({
      id: newDoc.id,
      ...newDoc.data(),
      created_at: new Date(),
      updated_at: new Date(),
      display_date: new Date(displayDate)
    })
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

    const docRef = db.collection('messages').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'הודעה לא נמצאה' })
    }

    await docRef.update({
      subject,
      content,
      display_date: new Date(displayDate),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    })

    const updatedDoc = await docRef.get()
    res.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
      created_at: updatedDoc.data().created_at?.toDate?.() || updatedDoc.data().created_at,
      updated_at: new Date(),
      display_date: new Date(displayDate)
    })
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

    const docRef = db.collection('messages').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'הודעה לא נמצאה' })
    }

    await docRef.delete()

    // If deleted message was the active one, silently switch to next available
    if (workspace) {
      const ws = getWorkspace(workspace)
      if (ws.activeMessageId === id) {
        const messagesRef = db.collection('messages')
        const nextMessage = await messagesRef
          .where('workspace_code', '==', workspace)
          .orderBy('created_at', 'desc')
          .limit(1)
          .get()
        ws.activeMessageId = nextMessage.docs[0]?.id || null
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
    const usersRef = db.collection('users')
    const snapshot = await usersRef.orderBy('created_at', 'desc').get()

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      username: doc.data().username,
      display_name: doc.data().display_name,
      workspace_code: doc.data().workspace_code,
      input_pin: doc.data().input_pin,
      display_pin: doc.data().display_pin,
      created_at: doc.data().created_at?.toDate?.() || doc.data().created_at
    }))

    res.json(users)
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
    const userDoc = await db.collection('users').doc(id).get()
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'משתמש לא נמצא' })
    }

    const workspaceCode = userDoc.data().workspace_code

    // Delete user's settings
    const settingsRef = db.collection('settings')
    const settingsSnapshot = await settingsRef.where('workspace_code', '==', workspaceCode).get()
    const settingsDeletePromises = settingsSnapshot.docs.map(doc => doc.ref.delete())
    await Promise.all(settingsDeletePromises)

    // Delete user's messages
    const messagesRef = db.collection('messages')
    const messagesSnapshot = await messagesRef.where('workspace_code', '==', workspaceCode).get()
    const messagesDeletePromises = messagesSnapshot.docs.map(doc => doc.ref.delete())
    await Promise.all(messagesDeletePromises)

    // Delete user
    await db.collection('users').doc(id).delete()

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

    const userRef = db.collection('users').doc(id)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'משתמש לא נמצא' })
    }

    const passwordHash = hashPassword(password)
    await userRef.update({ password_hash: passwordHash })

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

    const userRef = db.collection('users').doc(id)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'משתמש לא נמצא' })
    }

    const updates = {}
    if (inputPin) updates.input_pin = inputPin
    if (displayPin) updates.display_pin = displayPin

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'לא סופקו ערכים לעדכון' })
    }

    await userRef.update(updates)

    res.json({ success: true, message: 'קודי PIN עודכנו בהצלחה' })
  } catch (error) {
    console.error('Error updating PINs:', error)
    res.status(500).json({ error: 'שגיאה בעדכון קודי PIN' })
  }
})

// Update display name by workspace code
app.put('/api/display-name', async (req, res) => {
  try {
    const { workspace, displayName } = req.body

    if (!workspace || !displayName) {
      return res.status(400).json({ error: 'חסרים פרטים' })
    }

    const usersRef = db.collection('users')
    const snapshot = await usersRef.where('workspace_code', '==', workspace).get()

    if (snapshot.empty) {
      return res.status(404).json({ error: 'משתמש לא נמצא' })
    }

    const userDoc = snapshot.docs[0]
    await userDoc.ref.update({ display_name: displayName })

    res.json({ success: true, displayName })
  } catch (error) {
    console.error('Error updating display name:', error)
    res.status(500).json({ error: 'שגיאה בעדכון שם התצוגה' })
  }
})

// Admin: Login as user (get their workspace access)
app.post('/api/admin/login-as/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userDoc = await db.collection('users').doc(id).get()

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'משתמש לא נמצא' })
    }

    const userData = userDoc.data()
    res.json({
      success: true,
      user: {
        id: userDoc.id,
        username: userData.username,
        display_name: userData.display_name,
        workspace_code: userData.workspace_code
      }
    })
  } catch (error) {
    console.error('Error logging in as user:', error)
    res.status(500).json({ error: 'שגיאה בכניסה כמשתמש' })
  }
})

// Admin: Clear all data
app.delete('/api/admin/clear-all', async (req, res) => {
  try {
    // Delete all settings
    const settingsSnapshot = await db.collection('settings').get()
    const settingsDeletes = settingsSnapshot.docs.map(doc => doc.ref.delete())
    await Promise.all(settingsDeletes)

    // Delete all messages
    const messagesSnapshot = await db.collection('messages').get()
    const messagesDeletes = messagesSnapshot.docs.map(doc => doc.ref.delete())
    await Promise.all(messagesDeletes)

    // Delete all users
    const usersSnapshot = await db.collection('users').get()
    const usersDeletes = usersSnapshot.docs.map(doc => doc.ref.delete())
    await Promise.all(usersDeletes)

    res.json({ success: true, message: 'All data cleared' })
  } catch (error) {
    console.error('Error clearing data:', error)
    res.status(500).json({ error: 'שגיאה במחיקת הנתונים' })
  }
})

// Admin: Reset database (clear all collections)
app.post('/api/admin/reset-db', async (req, res) => {
  try {
    console.log('Resetting database...')

    // Delete all settings
    const settingsSnapshot = await db.collection('settings').get()
    const settingsDeletes = settingsSnapshot.docs.map(doc => doc.ref.delete())
    await Promise.all(settingsDeletes)

    // Delete all messages
    const messagesSnapshot = await db.collection('messages').get()
    const messagesDeletes = messagesSnapshot.docs.map(doc => doc.ref.delete())
    await Promise.all(messagesDeletes)

    // Delete all users
    const usersSnapshot = await db.collection('users').get()
    const usersDeletes = usersSnapshot.docs.map(doc => doc.ref.delete())
    await Promise.all(usersDeletes)

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
    const usersRef = db.collection('users')
    const snapshot = await usersRef.where('workspace_code', '==', workspaceCode).get()

    if (snapshot.empty) {
      return res.status(404).json({ error: 'מרחב עבודה לא נמצא' })
    }

    const userData = snapshot.docs[0].data()

    // Mark as paired
    pairing.paired = true
    pairing.workspaceCode = workspaceCode
    pairing.displayName = userData.display_name

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

    const messagesRef = db.collection('messages')

    if (!ws.activeMessageId) {
      // If no active message, return latest
      const snapshot = await messagesRef
        .where('workspace_code', '==', workspace)
        .orderBy('created_at', 'desc')
        .limit(1)
        .get()

      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        message = {
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.() || doc.data().created_at,
          updated_at: doc.data().updated_at?.toDate?.() || doc.data().updated_at,
          display_date: doc.data().display_date?.toDate?.() || doc.data().display_date
        }
        ws.activeMessageId = doc.id
      }
    } else {
      const doc = await messagesRef.doc(ws.activeMessageId).get()
      if (!doc.exists || doc.data().workspace_code !== workspace) {
        // If active message was deleted, return latest
        ws.activeMessageId = null
        const snapshot = await messagesRef
          .where('workspace_code', '==', workspace)
          .orderBy('created_at', 'desc')
          .limit(1)
          .get()

        if (!snapshot.empty) {
          const latestDoc = snapshot.docs[0]
          message = {
            id: latestDoc.id,
            ...latestDoc.data(),
            created_at: latestDoc.data().created_at?.toDate?.() || latestDoc.data().created_at,
            updated_at: latestDoc.data().updated_at?.toDate?.() || latestDoc.data().updated_at,
            display_date: latestDoc.data().display_date?.toDate?.() || latestDoc.data().display_date
          }
          ws.activeMessageId = latestDoc.id
        }
      } else {
        message = {
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.() || doc.data().created_at,
          updated_at: doc.data().updated_at?.toDate?.() || doc.data().updated_at,
          display_date: doc.data().display_date?.toDate?.() || doc.data().display_date
        }
      }
    }

    // Get pinned message from database for this workspace
    const settingsRef = db.collection('settings')
    const pinnedMessageDoc = await settingsRef.doc(`pinned_message_${workspace}`).get()
    const pinnedEnabledDoc = await settingsRef.doc(`pinned_enabled_${workspace}`).get()

    // Get pinned image from database for this workspace
    const pinnedImageDoc = await settingsRef.doc(`pinned_image_${workspace}`).get()
    const pinnedImageEnabledDoc = await settingsRef.doc(`pinned_image_enabled_${workspace}`).get()

    // Get display name from users table
    const usersRef = db.collection('users')
    const userSnapshot = await usersRef.where('workspace_code', '==', workspace).get()
    const displayName = userSnapshot.empty ? 'מוקד עידכונים' : userSnapshot.docs[0].data().display_name

    // Return message with theme, activeMessageId, lastExplicitChange, pinned message, pinned image and displayName
    res.json({
      message,
      theme: ws.activeTheme,
      activeMessageId: ws.activeMessageId,
      lastExplicitChange: ws.lastExplicitChange,
      pinnedMessage: pinnedMessageDoc.exists ? pinnedMessageDoc.data().value : '',
      pinnedMessageEnabled: pinnedEnabledDoc.exists ? pinnedEnabledDoc.data().value === 'true' : false,
      pinnedImage: pinnedImageDoc.exists ? pinnedImageDoc.data().value : '',
      pinnedImageEnabled: pinnedImageEnabledDoc.exists ? pinnedImageEnabledDoc.data().value === 'true' : false,
      displayName
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

    const settingsRef = db.collection('settings')
    const messageDoc = await settingsRef.doc(`pinned_message_${workspace}`).get()
    const enabledDoc = await settingsRef.doc(`pinned_enabled_${workspace}`).get()

    res.json({
      message: messageDoc.exists ? messageDoc.data().value : '',
      enabled: enabledDoc.exists ? enabledDoc.data().value === 'true' : false
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

    const settingsRef = db.collection('settings')

    if (message !== undefined) {
      await settingsRef.doc(`pinned_message_${workspace}`).set({
        key: 'pinned_message',
        workspace_code: workspace,
        value: message,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      })
    }
    if (enabled !== undefined) {
      await settingsRef.doc(`pinned_enabled_${workspace}`).set({
        key: 'pinned_enabled',
        workspace_code: workspace,
        value: enabled.toString(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      })
    }

    // Get current values
    const messageDoc = await settingsRef.doc(`pinned_message_${workspace}`).get()
    const enabledDoc = await settingsRef.doc(`pinned_enabled_${workspace}`).get()

    res.json({
      success: true,
      message: messageDoc.exists ? messageDoc.data().value : '',
      enabled: enabledDoc.exists ? enabledDoc.data().value === 'true' : false
    })
  } catch (error) {
    console.error('Error setting pinned message:', error)
    res.status(500).json({ error: 'שגיאה בהגדרת ההודעה הנעוצה' })
  }
})

// Get pinned image - with workspace
app.get('/api/pinned-image', async (req, res) => {
  try {
    const { workspace } = req.query
    if (!workspace) {
      return res.status(400).json({ error: 'workspace code is required' })
    }

    const settingsRef = db.collection('settings')
    const imageDoc = await settingsRef.doc(`pinned_image_${workspace}`).get()
    const enabledDoc = await settingsRef.doc(`pinned_image_enabled_${workspace}`).get()

    res.json({
      image: imageDoc.exists ? imageDoc.data().value : '',
      enabled: enabledDoc.exists ? enabledDoc.data().value === 'true' : false
    })
  } catch (error) {
    console.error('Error fetching pinned image:', error)
    res.status(500).json({ error: 'שגיאה בטעינת התמונה הנעוצה' })
  }
})

// Set pinned image - with workspace
app.post('/api/pinned-image', async (req, res) => {
  try {
    const { image, enabled, workspace } = req.body
    if (!workspace) {
      return res.status(400).json({ error: 'workspace code is required' })
    }

    const settingsRef = db.collection('settings')

    if (image !== undefined) {
      await settingsRef.doc(`pinned_image_${workspace}`).set({
        key: 'pinned_image',
        workspace_code: workspace,
        value: image,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      })
    }
    if (enabled !== undefined) {
      await settingsRef.doc(`pinned_image_enabled_${workspace}`).set({
        key: 'pinned_image_enabled',
        workspace_code: workspace,
        value: enabled.toString(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      })
    }

    // Get current values
    const imageDoc = await settingsRef.doc(`pinned_image_${workspace}`).get()
    const enabledDoc = await settingsRef.doc(`pinned_image_enabled_${workspace}`).get()

    res.json({
      success: true,
      image: imageDoc.exists ? imageDoc.data().value : '',
      enabled: enabledDoc.exists ? enabledDoc.data().value === 'true' : false
    })
  } catch (error) {
    console.error('Error setting pinned image:', error)
    res.status(500).json({ error: 'שגיאה בהגדרת התמונה הנעוצה' })
  }
})

// Delete pinned image - with workspace
app.delete('/api/pinned-image', async (req, res) => {
  try {
    const { workspace } = req.query
    if (!workspace) {
      return res.status(400).json({ error: 'workspace code is required' })
    }

    const settingsRef = db.collection('settings')
    await settingsRef.doc(`pinned_image_${workspace}`).delete()
    await settingsRef.doc(`pinned_image_enabled_${workspace}`).set({
      key: 'pinned_image_enabled',
      workspace_code: workspace,
      value: 'false',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting pinned image:', error)
    res.status(500).json({ error: 'שגיאה במחיקת התמונה הנעוצה' })
  }
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Connected to Firebase Firestore')
})
