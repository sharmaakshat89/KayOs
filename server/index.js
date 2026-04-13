import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import debateRoutes from './routes/debateRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

if (!process.env.OPENROUTER_API_KEY) {
  console.error('FATAL: OPENROUTER_API_KEY is not set in .env')
  process.exit(1)
}

if (!process.env.MONGO_URI) {
  console.warn('WARNING: MONGO_URI not set, using default localhost')
}

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGIN || '*' 
    : '*'
}))
app.use(express.json({ limit: '100kb' }))

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.use('/api/debate', debateRoutes)

app.use((err, req, res, next) => {
  console.error('Server error:', err.message)
  res.status(500).json({ error: true, message: 'Something went wrong' })
})

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pixel-debate')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error:', err.message))

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})