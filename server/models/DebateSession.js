import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  agentId: { type: String, required: true },
  content: { type: String, required: true },
  round: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  messageId: { type: String }
}, { _id: false })

const memoryEntrySchema = new mongoose.Schema({
  type: { type: String, enum: ['insult', 'attack', 'dismissal'], required: true },
  content: { type: String, required: true },
  fromAgent: { type: String, required: true },
  round: { type: Number, required: true }
}, { _id: false })

const agentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  personality: { type: String, required: true },
  model: { type: String, required: true },
  color: { type: String, default: 'green' },
  positionTitle: { type: String },
  memory: [memoryEntrySchema]
}, { _id: false })

const positionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }
}, { _id: false })

const debateSessionSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  positions: [positionSchema],
  agents: [agentSchema],
  messages: [messageSchema],
  interrupts: [messageSchema],
  chaosLevel: { type: Number, default: 50 },
  currentRound: { type: Number, default: 0 },
  __version: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

debateSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 * 7 })
debateSessionSchema.index({ 'messages.round': 1 })
debateSessionSchema.index({ 'agents.id': 1 })

export default mongoose.model('DebateSession', debateSessionSchema)