import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Generate a signed JWT
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })

// @route  POST /api/auth/signup
// @access Public
export const signup = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' })
    }

    const user = await User.create({ email, password })

    res.status(201).json({
      message: 'Account created successfully',
      token: generateToken(user._id),
      user: { id: user._id, email: user.email },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  POST /api/auth/login
// @access Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    res.status(200).json({
      message: 'Login successful',
      token: generateToken(user._id),
      user: { id: user._id, email: user.email },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
