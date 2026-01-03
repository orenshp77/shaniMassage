const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ message: 'נדרשת הרשאה, אנא התחבר' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: 'טוקן לא תקף' })
  }
}

module.exports = auth
