const express = require('express')
const router = express.Router()

// Import route modules
// const authRoutes = require('./auth')
// const userRoutes = require('./users')

// Use routes
// router.use('/auth', authRoutes)
// router.use('/users', userRoutes)

// Default route
router.get('/', (req, res) => {
  res.json({ message: 'API is working!' })
})

module.exports = router
