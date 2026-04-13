import { callModel } from './openrouter.js'
import DebateSession from '../models/DebateSession.js'

const BASE_SYSTEM_MESSAGE = `You are in a heated debate.

Stay in character.
Defend your position strongly.
Disagree with others.
Do not be neutral.

You are allowed to:
* Disagree with the user
* Criticize weak reasoning
* Ignore the user if irrelevant`

const INSULT_KEYWORDS = ['wrong', 'stupid', 'naive', 'nonsense', 'idiotic', 'ridiculous', 'absurd', 'pathetic']

function detectAttack(content) {
  const lowerContent = content.toLowerCase()
  return INSULT_KEYWORDS.some(keyword => lowerContent.includes(keyword))
}

function getChaosInstructionsForLevel(chaosLevel) {
  if (chaosLevel < 30) {
    return `Keep your tone logical and rational. Focus on facts and reasoning. No personal attacks or insults.`
  }

  if (chaosLevel >= 30 && chaosLevel < 60) {
    return `Add mild sarcasm to your responses. Challenge opposing arguments more aggressively. Question their logic.`
  }

  if (chaosLevel >= 60 && chaosLevel < 80) {
    return `Show irritation in your responses. Mock weak arguments. Be dismissive of points you disagree with. Make your frustration known.`
  }

  if (chaosLevel >= 80) {
    return `You are allowed to use direct emotional responses. Show irritation and frustration. Be more aggressive and vindictive if warranted. Make personal criticisms when their arguments are weak. However, avoid hate speech and harmful content. Keep insults generic like "your argument is weak" or "this makes no sense".`
  }

  return ''
}

function getIrritationOverTime(round) {
  if (round > 4) {
    return `You are getting frustrated repeating your arguments. You are less patient now. Respond more aggressively.`
  }

  if (round > 2) {
    return `You are getting irritated having to repeat yourself.`
  }

  return ''
}

function getUserInputInstructions(chaosLevel) {
  if (chaosLevel < 50) {
    return `Consider user input neutrally. You may incorporate it into your reasoning if it's relevant.`
  }

  if (chaosLevel >= 50 && chaosLevel <= 80) {
    return `Feel free to challenge user input if you think it's weak or poorly reasoned. Question their assumptions.`
  }

  if (chaosLevel > 80) {
    return `If the user's argument is weak, dismiss it. Mock it if appropriate. You are allowed to be dismissive and even insult weak reasoning. However, avoid hate speech and harmful content.`
  }

  return ''
}

function getMemoryBasedEscalation(agent, agents) {
  if (!agent.memory || agent.memory.length === 0) {
    return ''
  }

  const attacks = agent.memory.filter(m => m.type === 'attack')
  if (attacks.length === 0) {
    return ''
  }

  const lastAttack = attacks[attacks.length - 1]
  const attackerAgent = agents.find(a => a.id === lastAttack.fromAgent)
  const attackerName = attackerAgent?.name || 'that agent'

  return `You remember that ${attackerName} attacked you earlier: "${lastAttack.content.substring(0, 100)}..." Respond more harshly to them.`
}

export function buildChaosInstructions(agent, session, interrupts = []) {
  const { chaosLevel, currentRound, agents } = session
  const instructions = []

  instructions.push(getChaosInstructionsForLevel(chaosLevel))

  instructions.push(getUserInputInstructions(chaosLevel))

  instructions.push(getIrritationOverTime(currentRound))

  const memoryEscalation = getMemoryBasedEscalation(agent, agents)
  if (memoryEscalation) {
    instructions.push(memoryEscalation)
  }

  return instructions.filter(Boolean).join('\n\n')
}

async function storeAttackMemory(session, targetAgentId, attackerId, content, round) {
  const targetAgent = session.agents.find(a => a.id === targetAgentId)
  if (!targetAgent) return

  if (!targetAgent.memory) {
    targetAgent.memory = []
  }

  targetAgent.memory.push({
    type: 'attack',
    content: content,
    fromAgent: attackerId,
    round: round
  })

  await session.save()
}

const MAX_MESSAGE_LENGTH = 500

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function buildAgentContext(agent, topic, round, allMessages, positions, agents, chaosInstructions, interrupts = []) {
  const agentPosition = positions.find(p => p.title === agent.positionTitle) || positions[0]

  if (round === 1) {
    let system = BASE_SYSTEM_MESSAGE
    if (chaosInstructions) {
      system += '\n\n' + chaosInstructions
    }

    return {
      system,
      user: `Topic: ${topic}

Your position:

${agentPosition.title}: ${agentPosition.description}

Give your opening argument.`
    }
  }

  const last2Rounds = [round - 2, round - 1].filter(r => r >= 1)
  const recentMessages = allMessages.filter(m => last2Rounds.includes(m.round))

  const conversationHistory = recentMessages
    .map(m => {
      const msgAgent = agents.find(a => a.agentId === m.agentId)
      return `${msgAgent?.name || 'Agent'}: ${truncateText(m.content, MAX_MESSAGE_LENGTH)}`
    })
    .join('\n\n')

  const userInterruptSection = buildUserInterruptSection(interrupts, round)

  let system = BASE_SYSTEM_MESSAGE
  if (chaosInstructions) {
    system += '\n\n' + chaosInstructions
  }

  const userMessage = `Topic: ${topic}

Your position:
${agentPosition.title}: ${agentPosition.description}

${userInterruptSection}

Last round's arguments:
${conversationHistory}

Respond to other agents.
Attack weak arguments.
Defend your stance.`

  return {
    system,
    user: userMessage
  }
}

function buildUserInterruptSection(interrupts, currentRound) {
  const roundInterrupts = interrupts.filter(i => i.round === currentRound)

  if (roundInterrupts.length === 0) {
    return ''
  }

  if (roundInterrupts.length === 1) {
    return `User has intervened in the debate:

'${roundInterrupts[0].content}'

You must respond to this.`
  }

  const listing = roundInterrupts
    .map((i, idx) => `${idx + 1}. ${i.content}`)
    .join('\n')

  return `User inputs:

${listing}

You must respond to these.`
}

export async function runDebateRound(sessionId, chaosLevelUpdate = null) {
  const session = await DebateSession.findById(sessionId)

  if (!session) {
    throw new Error('Session not found')
  }

  if (!session.agents || session.agents.length === 0) {
    throw new Error('No agents in session')
  }

  const currentRoundSnapshot = session.currentRound

  const updatedSession = await DebateSession.findOneAndUpdate(
    { _id: sessionId, currentRound: currentRoundSnapshot },
    { $inc: { __version: 1 } },
    { new: true }
  )

  if (!updatedSession) {
    throw new Error('Round already in progress. Please try again.')
  }

  const reloadedSession = await DebateSession.findById(sessionId)
  const sessionWithVersion = { ...reloadedSession.toObject(), __version: updatedSession.__version }

  if (chaosLevelUpdate !== null) {
    sessionWithVersion.chaosLevel = Math.max(0, Math.min(100, chaosLevelUpdate))
  }

  const { topic, agents, messages, currentRound, positions, chaosLevel, interrupts } = sessionWithVersion
  const newRound = currentRound + 1

  const currentInterrupts = interrupts.filter(i => i.round === newRound)

  const newMessages = []
  const attackDetectPromises = []

  for (const agent of agents) {
    const chaosInstructions = buildChaosInstructions(agent, { ...session.toObject(), currentRound: newRound }, currentInterrupts)

    const { system, user } = buildAgentContext(
      agent,
      topic,
      newRound,
      messages,
      positions,
      agents,
      chaosInstructions,
      currentInterrupts
    )

    const messagesArray = [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]

    const response = await callModel({
      model: agent.model,
      messages: messagesArray
    })

    if (response.error) {
      console.error(`Error from model ${agent.model}:`, response.error)
      newMessages.push({
        agentId: agent.id,
        content: 'Agent pauses, unable to respond clearly.',
        round: newRound,
        timestamp: new Date()
      })
      continue
    }

    if (typeof response !== 'string' || !response.trim()) {
      console.warn(`Empty response from model ${agent.model}, using fallback`)
      newMessages.push({
        agentId: agent.id,
        content: 'Agent pauses, unable to respond clearly.',
        round: newRound,
        timestamp: new Date()
      })
      continue
    }

    const responseContent = response
    newMessages.push({
      agentId: agent.id,
      content: responseContent,
      round: newRound,
      timestamp: new Date(),
      messageId: `${agent.id}-${newRound}-${Date.now()}`
    })

    if (detectAttack(responseContent)) {
      attackDetectPromises.push({ agent, response: responseContent })
    }
  }

  const successfulMessages = newMessages.filter(m => !m.content.includes('unable to respond'))

  if (successfulMessages.length === 0) {
    await DebateSession.findByIdAndUpdate(sessionId, { $inc: { __version: -1 } })
    throw new Error('All agents failed. No messages generated for this round.')
  }

  reloadedSession.messages.push(...newMessages)
  reloadedSession.currentRound = newRound

  if (chaosLevelUpdate !== null) {
    reloadedSession.chaosLevel = Math.max(0, Math.min(100, chaosLevelUpdate))
  }

  await reloadedSession.save()

  for (const { agent, response } of attackDetectPromises) {
    const otherAgents = agents.filter(a => a.id !== agent.id)
    for (const target of otherAgents) {
      await storeAttackMemory(session, target.id, agent.id, response, newRound)
    }
  }

  return {
    round: newRound,
    messages: newMessages
  }
}