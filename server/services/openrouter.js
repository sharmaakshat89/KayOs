import axios from 'axios'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

const MAX_TOKENS = 500
const REQUEST_TIMEOUT = 15000

function truncatePrompt(prompt, maxLength = 4000) {
  if (!prompt || typeof prompt !== 'string') return prompt
  if (prompt.length <= maxLength) return prompt
  return prompt.substring(0, maxLength) + '...'
}

async function retryCall(model, messages, maxTokens) {
  return axios.post(
    OPENROUTER_BASE_URL,
    {
      model,
      messages,
      temperature: 0.8,
      max_tokens: maxTokens
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: REQUEST_TIMEOUT
    }
  )
}

export async function callModel({ model, messages, temperature = 0.8, max_tokens = MAX_TOKENS }) {
  try {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return { error: 'Invalid messages array' }
    }

    const truncatedMessages = messages.map(msg => ({
      ...msg,
      content: truncatePrompt(msg.content)
    }))

    let response
    try {
      response = await retryCall(model, truncatedMessages, max_tokens)
    } catch (firstAttempt) {
      console.log('First attempt failed, retrying...')
      response = await retryCall(model, truncatedMessages, max_tokens)
    }

    const content = response.data?.choices?.[0]?.message?.content

    if (!content || typeof content !== 'string' || content.trim() === '') {
      console.log('Empty response, retrying once...')
      response = await retryCall(model, truncatedMessages, max_tokens)
      const retryContent = response.data?.choices?.[0]?.message?.content

      if (!retryContent || typeof retryContent !== 'string' || retryContent.trim() === '') {
        return { error: 'Agent pauses, unable to respond clearly.' }
      }
      return retryContent.trim()
    }

    return content.trim()
  } catch (error) {
    console.error('OpenRouter API error:', error.message)
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return { error: 'Request timed out. Please try again.' }
    }
    
    return { error: error.response?.data?.error?.message || error.message || 'Unknown error' }
  }
}