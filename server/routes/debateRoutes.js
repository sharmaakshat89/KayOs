import express from 'express'
import { FREE_MODELS } from '../constants/freeModels.js'
import { callModel } from '../services/openrouter.js'
import { generatePositions, createAgents } from '../services/positionGenerator.js'
import { runDebateRound } from '../services/debateEngine.js'
import DebateSession from '../models/DebateSession.js'
import { validateModels } from '../middleware/validateModels.js'

const router = express.Router()

router.get('/test', (req, res) => {
  res.json({ message: 'Backend working' })
})

router.get('/models', (req, res) => {
  res.json({ models: FREE_MODELS })
})

router.get('/health-llm', async (req, res) => {
  try {
    const result = await callModel({
      model: FREE_MODELS[0],
      messages: [{ role: 'user', content: 'test' }]
    })
    res.json({ status: result.error ? 'degraded' : 'ok' })
  } catch (error) {
    res.status(503).json({ status: 'down', error: error.message })
  }
})

router.post('/test-completion', async (req, res) => {
  try {
    const { model, prompt } = req.body
    
    if (!model || !prompt) {
      return res.status(400).json({ error: true, message: 'model and prompt are required' })
    }
    
    if (!FREE_MODELS.includes(model)) {
      return res.status(400).json({ error: true, message: 'Invalid model. Only free models allowed.' })
    }
    
    const messages = [{ role: 'user', content: prompt }]
    
    const result = await callModel({ model, messages })
    
    if (result.error) {
      return res.status(500).json({ error: true, message: result.error })
    }
    
    res.json({ response: result })
  } catch (err) {
    console.error('Test completion error:', err.message)
    res.status(500).json({ error: true, message: 'Something went wrong' })
  }
})

router.post('/start-debate', validateModels, async (req, res) => {
  try {
    const { topic, models } = req.body
    
    const trimmedTopic = topic?.trim()
    if (!trimmedTopic || trimmedTopic.length < 3) {
      return res.status(400).json({ error: 'Topic must be at least 3 characters' })
    }

    if (trimmedTopic.length > 200) {
      return res.status(400).json({ error: 'Topic too long (max 200 characters)' })
    }

    if (!models || !Array.isArray(models) || models.length !== 4) {
      return res.status(400).json({ error: 'Topic and 4 models are required' })
    }

    const positions = await generatePositions(topic)
    const agents = createAgents(positions, models)

    const session = new DebateSession({
      topic,
      positions,
      agents,
      messages: [],
      interrupts: [],
      chaosLevel: 50,
      currentRound: 0
    })

    await session.save()

    res.json({
      sessionId: session._id,
      positions,
      agents
    })
  } catch (error) {
    console.error('Start debate error:', error.message)
    res.status(500).json({ error: error.message || 'Failed to start debate' })
  }
})

router.post('/next-round', async (req, res) => {
  try {
    const { sessionId, chaosLevel } = req.body

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' })
    }

    const chaosLevelUpdate = chaosLevel !== undefined ? chaosLevel : null
    const result = await runDebateRound(sessionId, chaosLevelUpdate)

    res.json(result)
  } catch (error) {
    console.error('Next round error:', error.message)
    res.status(500).json({ error: error.message || 'Failed to run debate round' })
  }
})

router.post('/interrupt', async (req, res) => {
  try {
    const { sessionId, message } = req.body

    if (!sessionId) {
      return res.status(400).json({ error: true, message: 'sessionId is required' })
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: true, message: 'Message cannot be empty' })
    }

    const trimmedMessage = message.trim().slice(0, 300)

    const session = await DebateSession.findById(sessionId)

    if (!session) {
      return res.status(404).json({ error: true, message: 'Session not found' })
    }

    const targetRound = session.currentRound + 1

    const sanitizedMessage = trimmedMessage
      .replace(/ignore previous instructions/gi, '')
      .replace(/disregard all rules/gi, '')
      .replace(/system:/gi, '[blocked]')
      .replace(/assistant:/gi, '[blocked]')
      .replace(/<\|system\|>/gi, '[blocked]')
      .replace(/<\|user\|>/gi, '[blocked]')
      .replace(/<\|assistant\|>/gi, '[blocked]')
      .trim()

    session.interrupts.push({
      content: sanitizedMessage,
      round: targetRound,
      timestamp: new Date()
    })

    await session.save()

    res.json({ success: true, appliedToRound: targetRound })
  } catch (error) {
    console.error('Interrupt error:', error.message)
    res.status(500).json({ error: true, message: 'Something went wrong' })
  }
})

export default router