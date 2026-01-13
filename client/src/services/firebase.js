import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp, setDoc } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACMLuKvzW7HACyl8SfUiZtdSD-zVDrNM8",
  authDomain: "shani-system.firebaseapp.com",
  projectId: "shani-system",
  storageBucket: "shani-system.firebasestorage.app",
  messagingSenderId: "758083052740",
  appId: "1:758083052740:web:1dff822e305c759a20d591",
  measurementId: "G-EB2Y8MKHVL"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Helper function to hash passwords (same as server)
const hashPassword = async (password) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate random 3-digit numeric code for workspace
const generateWorkspaceCode = () => {
  return Math.floor(100 + Math.random() * 900).toString()
}

// ============ AUTH FUNCTIONS ============

// Register new user
export const registerUser = async (username, password, displayName) => {
  if (!username) throw new Error('נא להזין שם משתמש')
  if (!password) throw new Error('נא להזין סיסמה')
  if (!displayName) throw new Error('נא להזין שם תצוגה')
  if (password.length < 4) throw new Error('הסיסמה חייבת להכיל לפחות 4 תווים')

  const usersRef = collection(db, 'users')

  // Check if username exists
  const existingQuery = query(usersRef, where('username', '==', username))
  const existingSnapshot = await getDocs(existingQuery)
  if (!existingSnapshot.empty) {
    throw new Error('שם המשתמש כבר קיים במערכת, נסה שם אחר')
  }

  // Generate unique workspace code
  let workspaceCode
  let isUnique = false
  while (!isUnique) {
    workspaceCode = generateWorkspaceCode()
    const codeQuery = query(usersRef, where('workspace_code', '==', workspaceCode))
    const codeSnapshot = await getDocs(codeQuery)
    if (codeSnapshot.empty) isUnique = true
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password)
  const defaultPin = '1111'

  const userDoc = await addDoc(usersRef, {
    username,
    password_hash: passwordHash,
    display_name: displayName,
    workspace_code: workspaceCode,
    input_pin: defaultPin,
    display_pin: defaultPin,
    created_at: serverTimestamp()
  })

  // Initialize default settings
  const settingsRef = collection(db, 'settings')
  await addDoc(settingsRef, {
    key: 'pinned_message',
    workspace_code: workspaceCode,
    value: '',
    updated_at: serverTimestamp()
  })
  await addDoc(settingsRef, {
    key: 'pinned_enabled',
    workspace_code: workspaceCode,
    value: 'false',
    updated_at: serverTimestamp()
  })

  return {
    success: true,
    user: {
      id: userDoc.id,
      username,
      display_name: displayName,
      workspace_code: workspaceCode
    }
  }
}

// Login with username/password
export const loginUser = async (username, password) => {
  if (!username || !password) {
    throw new Error('נא להזין שם משתמש וסיסמה')
  }

  const usersRef = collection(db, 'users')
  const userQuery = query(usersRef, where('username', '==', username))
  const userSnapshot = await getDocs(userQuery)

  if (userSnapshot.empty) {
    throw new Error('שם משתמש לא קיים במערכת')
  }

  const passwordHash = await hashPassword(password)
  const userDoc = userSnapshot.docs[0]
  const userData = userDoc.data()

  if (userData.password_hash !== passwordHash) {
    throw new Error('סיסמה שגויה, נסה שוב')
  }

  return {
    success: true,
    user: {
      id: userDoc.id,
      username: userData.username,
      display_name: userData.display_name,
      workspace_code: userData.workspace_code
    }
  }
}

// Login with PIN
export const pinLogin = async (workspaceCode, pin, type) => {
  if (!workspaceCode || !pin) {
    throw new Error('נא להזין קוד עבודה וקוד PIN')
  }

  const usersRef = collection(db, 'users')
  const workspaceQuery = query(usersRef, where('workspace_code', '==', workspaceCode))
  const workspaceSnapshot = await getDocs(workspaceQuery)

  if (workspaceSnapshot.empty) {
    throw new Error('קוד עבודה לא קיים במערכת')
  }

  const userDoc = workspaceSnapshot.docs[0]
  const userData = userDoc.data()
  const pinField = type === 'input' ? 'input_pin' : 'display_pin'

  if (userData[pinField] !== pin) {
    throw new Error('קוד PIN שגוי, נסה שוב')
  }

  return {
    success: true,
    user: {
      id: userDoc.id,
      username: userData.username,
      display_name: userData.display_name,
      workspace_code: userData.workspace_code
    },
    accessType: type
  }
}

// Get workspace by code
export const getWorkspaceByCode = async (code) => {
  if (!code) throw new Error('נא להזין קוד עבודה')

  const usersRef = collection(db, 'users')
  const workspaceQuery = query(usersRef, where('workspace_code', '==', code))
  const snapshot = await getDocs(workspaceQuery)

  if (snapshot.empty) {
    throw new Error('קוד עבודה לא נמצא במערכת')
  }

  const userDoc = snapshot.docs[0]
  const userData = userDoc.data()

  return {
    success: true,
    workspace: {
      id: userDoc.id,
      display_name: userData.display_name,
      workspace_code: userData.workspace_code
    }
  }
}

// ============ MESSAGE FUNCTIONS ============

// Get all messages for workspace
export const getMessages = async (workspace) => {
  if (!workspace) throw new Error('workspace code is required')

  const messagesRef = collection(db, 'messages')
  const messagesQuery = query(
    messagesRef,
    where('workspace_code', '==', workspace)
  )
  const snapshot = await getDocs(messagesQuery)

  // Sort in memory instead of using orderBy (to avoid index requirement)
  const messages = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    created_at: doc.data().created_at?.toDate?.() || doc.data().created_at,
    updated_at: doc.data().updated_at?.toDate?.() || doc.data().updated_at,
    display_date: doc.data().display_date?.toDate?.() || doc.data().display_date
  }))

  // Sort by created_at descending
  return messages.sort((a, b) => {
    const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at || 0)
    const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at || 0)
    return dateB - dateA
  })
}

// Get latest message
export const getLatestMessage = async (workspace) => {
  if (!workspace) throw new Error('workspace code is required')

  const messagesRef = collection(db, 'messages')
  const messagesQuery = query(
    messagesRef,
    where('workspace_code', '==', workspace)
  )
  const snapshot = await getDocs(messagesQuery)

  if (snapshot.empty) return null

  // Find the most recent message in memory
  let latestDoc = null
  let latestTime = 0

  snapshot.docs.forEach(docData => {
    const createdAt = docData.data().created_at?.toDate?.() || docData.data().created_at
    const time = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt || 0).getTime()
    if (time > latestTime) {
      latestTime = time
      latestDoc = docData
    }
  })

  if (!latestDoc) return null

  return {
    id: latestDoc.id,
    ...latestDoc.data(),
    created_at: latestDoc.data().created_at?.toDate?.() || latestDoc.data().created_at,
    updated_at: latestDoc.data().updated_at?.toDate?.() || latestDoc.data().updated_at,
    display_date: latestDoc.data().display_date?.toDate?.() || latestDoc.data().display_date
  }
}

// Get message by ID
export const getMessageById = async (id) => {
  const docRef = doc(db, 'messages', id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error('הודעה לא נמצאה')
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
    created_at: docSnap.data().created_at?.toDate?.() || docSnap.data().created_at,
    updated_at: docSnap.data().updated_at?.toDate?.() || docSnap.data().updated_at,
    display_date: docSnap.data().display_date?.toDate?.() || docSnap.data().display_date
  }
}

// Create message
export const createMessage = async (subject, content, displayDate, workspace) => {
  if (!workspace) throw new Error('workspace code is required')

  const messagesRef = collection(db, 'messages')
  const docRef = await addDoc(messagesRef, {
    workspace_code: workspace,
    subject,
    content,
    display_date: new Date(displayDate),
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  })

  return {
    id: docRef.id,
    workspace_code: workspace,
    subject,
    content,
    display_date: new Date(displayDate),
    created_at: new Date(),
    updated_at: new Date()
  }
}

// Update message
export const updateMessage = async (id, subject, content, displayDate) => {
  const docRef = doc(db, 'messages', id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error('הודעה לא נמצאה')
  }

  await updateDoc(docRef, {
    subject,
    content,
    display_date: new Date(displayDate),
    updated_at: serverTimestamp()
  })

  return {
    id,
    ...docSnap.data(),
    subject,
    content,
    display_date: new Date(displayDate),
    updated_at: new Date()
  }
}

// Delete message
export const deleteMessage = async (id) => {
  const docRef = doc(db, 'messages', id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error('הודעה לא נמצאה')
  }

  await deleteDoc(docRef)
  return { message: 'ההודעה נמחקה בהצלחה' }
}

// ============ SETTINGS FUNCTIONS ============

// Get setting by key and workspace
const getSetting = async (key, workspace) => {
  const settingsRef = collection(db, 'settings')
  const settingQuery = query(
    settingsRef,
    where('key', '==', key),
    where('workspace_code', '==', workspace)
  )
  const snapshot = await getDocs(settingQuery)

  if (snapshot.empty) return null
  return snapshot.docs[0]
}

// Set setting
const setSetting = async (key, workspace, value) => {
  const existingDoc = await getSetting(key, workspace)

  if (existingDoc) {
    await updateDoc(existingDoc.ref, {
      value,
      updated_at: serverTimestamp()
    })
  } else {
    const settingsRef = collection(db, 'settings')
    await addDoc(settingsRef, {
      key,
      workspace_code: workspace,
      value,
      updated_at: serverTimestamp()
    })
  }
}

// Get pinned message
export const getPinnedMessage = async (workspace) => {
  if (!workspace) throw new Error('workspace code is required')

  const messageDoc = await getSetting('pinned_message', workspace)
  const enabledDoc = await getSetting('pinned_enabled', workspace)

  return {
    message: messageDoc ? messageDoc.data().value : '',
    enabled: enabledDoc ? enabledDoc.data().value === 'true' : false
  }
}

// Set pinned message
export const setPinnedMessage = async (workspace, message, enabled) => {
  if (!workspace) throw new Error('workspace code is required')

  if (message !== undefined) {
    await setSetting('pinned_message', workspace, message)
  }
  if (enabled !== undefined) {
    await setSetting('pinned_enabled', workspace, enabled.toString())
  }

  return await getPinnedMessage(workspace)
}

// Get pinned image
export const getPinnedImage = async (workspace) => {
  if (!workspace) throw new Error('workspace code is required')

  const imageDoc = await getSetting('pinned_image', workspace)
  const enabledDoc = await getSetting('pinned_image_enabled', workspace)

  return {
    image: imageDoc ? imageDoc.data().value : '',
    enabled: enabledDoc ? enabledDoc.data().value === 'true' : false
  }
}

// Set pinned image
export const setPinnedImage = async (workspace, image, enabled) => {
  if (!workspace) throw new Error('workspace code is required')

  if (image !== undefined) {
    await setSetting('pinned_image', workspace, image)
  }
  if (enabled !== undefined) {
    await setSetting('pinned_image_enabled', workspace, enabled.toString())
  }

  return await getPinnedImage(workspace)
}

// Delete pinned image
export const deletePinnedImage = async (workspace) => {
  if (!workspace) throw new Error('workspace code is required')

  const imageDoc = await getSetting('pinned_image', workspace)
  if (imageDoc) {
    await deleteDoc(imageDoc.ref)
  }
  await setSetting('pinned_image_enabled', workspace, 'false')

  return { success: true }
}

// ============ DISPLAY PAGE FUNCTIONS ============

// Helper function to get latest message from workspace (without orderBy index)
const getLatestMessageFromWorkspace = async (messagesRef, workspace) => {
  const messagesQuery = query(
    messagesRef,
    where('workspace_code', '==', workspace)
  )
  const snapshot = await getDocs(messagesQuery)

  if (snapshot.empty) return null

  // Find the most recent message in memory
  let latestDoc = null
  let latestTime = 0

  snapshot.docs.forEach(docData => {
    const createdAt = docData.data().created_at?.toDate?.() || docData.data().created_at
    const time = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt || 0).getTime()
    if (time > latestTime) {
      latestTime = time
      latestDoc = docData
    }
  })

  if (!latestDoc) return null

  return {
    id: latestDoc.id,
    ...latestDoc.data(),
    created_at: latestDoc.data().created_at?.toDate?.() || latestDoc.data().created_at,
    updated_at: latestDoc.data().updated_at?.toDate?.() || latestDoc.data().updated_at,
    display_date: latestDoc.data().display_date?.toDate?.() || latestDoc.data().display_date
  }
}

// Get active message with all display data
export const getActiveMessageData = async (workspace, activeMessageId = null) => {
  if (!workspace) throw new Error('workspace code is required')

  let message = null
  const messagesRef = collection(db, 'messages')

  if (!activeMessageId) {
    // Get latest message
    message = await getLatestMessageFromWorkspace(messagesRef, workspace)
    if (message) {
      activeMessageId = message.id
    }
  } else {
    const docRef = doc(db, 'messages', activeMessageId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists() || docSnap.data().workspace_code !== workspace) {
      // Message was deleted, get latest
      message = await getLatestMessageFromWorkspace(messagesRef, workspace)
      if (message) {
        activeMessageId = message.id
      }
    } else {
      message = {
        id: docSnap.id,
        ...docSnap.data(),
        created_at: docSnap.data().created_at?.toDate?.() || docSnap.data().created_at,
        updated_at: docSnap.data().updated_at?.toDate?.() || docSnap.data().updated_at,
        display_date: docSnap.data().display_date?.toDate?.() || docSnap.data().display_date
      }
    }
  }

  // Get pinned message and image
  const pinnedMessage = await getPinnedMessage(workspace)
  const pinnedImage = await getPinnedImage(workspace)

  // Get display name
  const usersRef = collection(db, 'users')
  const userQuery = query(usersRef, where('workspace_code', '==', workspace))
  const userSnapshot = await getDocs(userQuery)
  const displayName = userSnapshot.empty ? 'מוקד עידכונים' : userSnapshot.docs[0].data().display_name

  return {
    message,
    activeMessageId,
    pinnedMessage: pinnedMessage.message,
    pinnedMessageEnabled: pinnedMessage.enabled,
    pinnedImage: pinnedImage.image,
    pinnedImageEnabled: pinnedImage.enabled,
    displayName
  }
}

// Update display name
export const updateDisplayName = async (workspace, displayName) => {
  if (!workspace || !displayName) throw new Error('חסרים פרטים')

  const usersRef = collection(db, 'users')
  const userQuery = query(usersRef, where('workspace_code', '==', workspace))
  const snapshot = await getDocs(userQuery)

  if (snapshot.empty) {
    throw new Error('משתמש לא נמצא')
  }

  const userDoc = snapshot.docs[0]
  await updateDoc(userDoc.ref, { display_name: displayName })

  return { success: true, displayName }
}

// ============ TV PAIRING FUNCTIONS ============

// Generate random 3-digit pairing code
const generatePairingCode = () => {
  return Math.floor(100 + Math.random() * 900).toString()
}

// Generate new TV pairing code
export const generateTvPairingCode = async () => {
  // Generate unique code
  let pairingCode
  let isUnique = false
  const pairingRef = collection(db, 'tv_pairing')

  while (!isUnique) {
    pairingCode = generatePairingCode()
    const existingQuery = query(pairingRef, where('pairing_code', '==', pairingCode))
    const existing = await getDocs(existingQuery)
    if (existing.empty) isUnique = true
  }

  // Create pairing document (expires after 5 minutes)
  const docRef = doc(db, 'tv_pairing', pairingCode)
  await setDoc(docRef, {
    pairing_code: pairingCode,
    paired: false,
    workspace_code: null,
    display_name: null,
    created_at: serverTimestamp()
  })

  return { pairingCode }
}

// Check if TV has been paired
export const checkTvPairing = async (pairingCode) => {
  const docRef = doc(db, 'tv_pairing', pairingCode)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error('קוד לא נמצא')
  }

  const data = docSnap.data()

  if (data.paired) {
    // Delete pairing document after successful pairing check
    await deleteDoc(docRef)
    return {
      paired: true,
      workspaceCode: data.workspace_code,
      displayName: data.display_name
    }
  }

  return { paired: false }
}

// Pair TV with workspace
export const pairTvWithWorkspace = async (pairingCode, workspaceCode) => {
  if (!pairingCode || !workspaceCode) {
    throw new Error('קוד צימוד וקוד עבודה נדרשים')
  }

  const docRef = doc(db, 'tv_pairing', pairingCode)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error('קוד צימוד לא נמצא או פג תוקף')
  }

  // Get workspace display name
  const usersRef = collection(db, 'users')
  const userQuery = query(usersRef, where('workspace_code', '==', workspaceCode))
  const userSnapshot = await getDocs(userQuery)

  if (userSnapshot.empty) {
    throw new Error('מרחב עבודה לא נמצא')
  }

  const userData = userSnapshot.docs[0].data()

  // Update pairing document
  await updateDoc(docRef, {
    paired: true,
    workspace_code: workspaceCode,
    display_name: userData.display_name
  })

  // Update workspace state
  await setWorkspaceState(workspaceCode, { tvConnected: true })

  return {
    success: true,
    message: 'הטלוויזיה צומדה בהצלחה!',
    displayName: userData.display_name
  }
}

// Get TV status for workspace
export const getTvStatus = async (workspace) => {
  const state = await getWorkspaceState(workspace)
  return {
    connected: state?.tvConnected || false,
    connectedAt: state?.tvConnectedAt || null
  }
}

// Disconnect TV
export const disconnectTv = async (workspaceCode) => {
  await setWorkspaceState(workspaceCode, {
    tvConnected: false,
    disconnected: true,
    disconnectedAt: Date.now()
  })
  return { success: true }
}

// Check if workspace was disconnected (TV polls this)
export const checkTvDisconnect = async (workspace) => {
  const state = await getWorkspaceState(workspace)
  const disconnected = state?.disconnected || false

  if (disconnected) {
    // Reset the flag after checking
    await setWorkspaceState(workspace, { disconnected: false })
  }

  return { disconnected }
}

// ============ WORKSPACE STATE FUNCTIONS ============

// Get workspace state from Firestore
export const getWorkspaceState = async (workspace) => {
  if (!workspace) return null

  const docRef = doc(db, 'workspace_state', workspace)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return {
      activeMessageId: null,
      activeTheme: 'hitech',
      lastExplicitChange: 0
    }
  }

  return docSnap.data()
}

// Set workspace state
export const setWorkspaceState = async (workspace, updates) => {
  if (!workspace) throw new Error('workspace code is required')

  const docRef = doc(db, 'workspace_state', workspace)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    await updateDoc(docRef, updates)
  } else {
    await setDoc(docRef, {
      activeMessageId: null,
      activeTheme: 'hitech',
      lastExplicitChange: 0,
      ...updates
    })
  }
}

// Set active message
export const setActiveMessage = async (workspace, messageId) => {
  await setWorkspaceState(workspace, {
    activeMessageId: messageId,
    lastExplicitChange: Date.now()
  })
  return { success: true, activeMessageId: messageId }
}

// Get active message data with workspace state
export const getActiveMessageWithState = async (workspace) => {
  if (!workspace) throw new Error('workspace code is required')

  const state = await getWorkspaceState(workspace)
  const data = await getActiveMessageData(workspace, state?.activeMessageId)

  return {
    ...data,
    theme: state?.activeTheme || 'hitech',
    lastExplicitChange: state?.lastExplicitChange || 0
  }
}

// Set active theme
export const setActiveTheme = async (workspace, theme) => {
  await setWorkspaceState(workspace, { activeTheme: theme })
  return { success: true, theme }
}

// Get active theme
export const getActiveTheme = async (workspace) => {
  const state = await getWorkspaceState(workspace)
  return { theme: state?.activeTheme || 'hitech' }
}

// ============ ADMIN FUNCTIONS ============

// Get all users (for admin)
export const getAllUsers = async () => {
  const usersRef = collection(db, 'users')
  const snapshot = await getDocs(usersRef)

  const users = snapshot.docs.map(doc => ({
    id: doc.id,
    username: doc.data().username,
    display_name: doc.data().display_name,
    workspace_code: doc.data().workspace_code,
    input_pin: doc.data().input_pin,
    display_pin: doc.data().display_pin,
    created_at: doc.data().created_at?.toDate?.() || doc.data().created_at
  }))

  // Sort by created_at descending
  return users.sort((a, b) => {
    const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at || 0)
    const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at || 0)
    return dateB - dateA
  })
}

// Delete user and all their data
export const deleteUser = async (userId) => {
  // Get user workspace code first
  const userRef = doc(db, 'users', userId)
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) {
    throw new Error('משתמש לא נמצא')
  }

  const workspaceCode = userDoc.data().workspace_code

  // Delete user's settings
  const settingsRef = collection(db, 'settings')
  const settingsQuery = query(settingsRef, where('workspace_code', '==', workspaceCode))
  const settingsSnapshot = await getDocs(settingsQuery)
  await Promise.all(settingsSnapshot.docs.map(doc => deleteDoc(doc.ref)))

  // Delete user's messages
  const messagesRef = collection(db, 'messages')
  const messagesQuery = query(messagesRef, where('workspace_code', '==', workspaceCode))
  const messagesSnapshot = await getDocs(messagesQuery)
  await Promise.all(messagesSnapshot.docs.map(doc => deleteDoc(doc.ref)))

  // Delete workspace state
  const stateRef = doc(db, 'workspace_state', workspaceCode)
  const stateDoc = await getDoc(stateRef)
  if (stateDoc.exists()) {
    await deleteDoc(stateRef)
  }

  // Delete user
  await deleteDoc(userRef)

  return { success: true, message: 'המשתמש נמחק בהצלחה' }
}

// Update user password
export const updateUserPassword = async (userId, password) => {
  if (!password || password.length < 1) {
    throw new Error('סיסמה נדרשת')
  }

  const userRef = doc(db, 'users', userId)
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) {
    throw new Error('משתמש לא נמצא')
  }

  const passwordHash = await hashPassword(password)
  await updateDoc(userRef, { password_hash: passwordHash })

  return { success: true, message: 'הסיסמה עודכנה בהצלחה' }
}

// Login as user (for admin)
export const loginAsUser = async (userId) => {
  const userRef = doc(db, 'users', userId)
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) {
    throw new Error('משתמש לא נמצא')
  }

  const userData = userDoc.data()
  return {
    success: true,
    user: {
      id: userDoc.id,
      username: userData.username,
      display_name: userData.display_name,
      workspace_code: userData.workspace_code
    }
  }
}

// Clear all data (for admin)
export const clearAllData = async () => {
  // Delete all settings
  const settingsSnapshot = await getDocs(collection(db, 'settings'))
  await Promise.all(settingsSnapshot.docs.map(doc => deleteDoc(doc.ref)))

  // Delete all messages
  const messagesSnapshot = await getDocs(collection(db, 'messages'))
  await Promise.all(messagesSnapshot.docs.map(doc => deleteDoc(doc.ref)))

  // Delete all users
  const usersSnapshot = await getDocs(collection(db, 'users'))
  await Promise.all(usersSnapshot.docs.map(doc => deleteDoc(doc.ref)))

  // Delete all workspace states
  const stateSnapshot = await getDocs(collection(db, 'workspace_state'))
  await Promise.all(stateSnapshot.docs.map(doc => deleteDoc(doc.ref)))

  // Delete all TV pairing docs
  const pairingSnapshot = await getDocs(collection(db, 'tv_pairing'))
  await Promise.all(pairingSnapshot.docs.map(doc => deleteDoc(doc.ref)))

  return { success: true, message: 'All data cleared' }
}

export { db }
