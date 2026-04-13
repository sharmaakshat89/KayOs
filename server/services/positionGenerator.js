import { callModel } from './openrouter.js'

const DEFAULT_MODEL = 'mistralai/mistral-7b-instruct'

function cleanJSONString(str) {
  let cleaned = str.trim()
  cleaned = cleaned.replace(/^```json\n?/, '')
  cleaned = cleaned.replace(/\n?```$/, '')
  cleaned = cleaned.replace(/^```\n?/, '')
  cleaned = cleaned.replace(/\n?```$/, '')
  return cleaned
}

function validatePositions(positions) {
  if (!Array.isArray(positions) || positions.length !== 4) {
    throw new Error('Response must contain exactly 4 positions')
  }
  
  for (const pos of positions) {
    if (!pos.title || typeof pos.title !== 'string') {
      throw new Error('Each position must have a title')
    }
    if (!pos.description || typeof pos.description !== 'string') {
      throw new Error('Each position must have a description')
    }
  }
  
  return positions
}

function parsePositions(response) {
  if (typeof response === 'object' && response.error) {
    throw new Error(response.error)
  }

  let cleaned = cleanJSONString(response)
  let parsed = JSON.parse(cleaned)
  
  if (!Array.isArray(parsed)) {
    throw new Error('Response is not an array')
  }
  
  return validatePositions(parsed)
}

export async function generatePositions(topic) {
  const systemMessage = `You are a debate architect.

Given a topic, your job is to create 4 sharply distinct and conflicting positions.

Rules:
* Each position must come from a different worldview (e.g. scientific, religious, nihilistic, technological, political, etc.)
* Minimize overlap between positions
* Each should strongly disagree with at least one other
* Avoid generic answers
* Make them debate-ready

Return ONLY valid JSON in this format:

[
{
"title": "short position name",
"description": "clear stance in 1–2 sentences"
}
]

Do NOT include explanations outside JSON.`

  const userMessage = `Topic: ${topic}`

  const messages = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userMessage }
  ]

  const response = await callModel({
    model: DEFAULT_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 800
  })

  return parsePositions(response)
}

export function createAgents(positions, selectedModels) {
  const agentNames = ['Agent A', 'Agent B', 'Agent C', 'Agent D']
  const colors = ['green', 'blue', 'red', 'yellow']
  
  return positions.map((position, index) => ({
    id: `agent-${index + 1}`,
    name: agentNames[index],
    personality: `You strongly believe: ${position.description}. You defend it aggressively.`,
    model: selectedModels[index] || DEFAULT_MODEL,
    color: colors[index],
    positionTitle: position.title,
    memory: []
  }))
}