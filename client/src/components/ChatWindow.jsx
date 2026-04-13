import { useState, useEffect, useRef, useCallback } from 'react'
import AgentBubble from './AgentBubble'

const AGENT_COLORS = {
  green: '#00ff9f',
  blue: '#00bfff',
  yellow: '#ffff00',
  red: '#ff0055',
  purple: '#aa55ff',
  orange: '#ffaa00'
}

const MESSAGE_MAX_WIDTH = 480

function ChatWindow({ messages = [], interrupts = [], chaosLevel = 50 }) {
  const [displayedMessages, setDisplayedMessages] = useState([])
  const [queue, setQueue] = useState([])
  const [currentSpeaker, setCurrentSpeaker] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)
  const isCancelledRef = useRef(false)
  const processingRef = useRef(false)

  const getBorderColor = useCallback(() => {
    if (chaosLevel >= 80) return '#ff0055'
    if (chaosLevel >= 60) return '#ff6600'
    if (chaosLevel >= 30) return '#ffaa00'
    return '#00ff9f'
  }, [chaosLevel])

  const getContainerStyle = useCallback(() => {
    const baseStyle = {
      minHeight: '200px',
      maxHeight: '400px',
      overflowY: 'auto',
      background: '#1a1a1a',
      border: `4px solid ${getBorderColor()}`,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      scrollBehavior: 'smooth'
    }

    if (chaosLevel >= 85) {
      return {
        ...baseStyle,
        animation: 'shake 0.2s infinite'
      }
    }

    return baseStyle
  }, [chaosLevel, getBorderColor])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [displayedMessages, queue, scrollToBottom])

  useEffect(() => {
    isCancelledRef.current = false
    return () => {
      isCancelledRef.current = true
    }
  }, [])

  useEffect(() => {
    const processedIds = new Set(displayedMessages.map(m => m.messageId).filter(Boolean))
    const processedKeys = new Set(displayedMessages.map(m => `${m.agentId}-${m.round}`).filter(Boolean))

    const userInterrupts = interrupts
      .filter(i => !processedIds.has(i.messageId))
      .map(i => ({
        ...i,
        messageId: i.messageId || `interrupt-${Date.now()}-${Math.random()}`,
        name: 'YOU',
        message: i.content,
        color: '#ffff00',
        isUser: true
      }))

    const newMessages = messages
      .filter(msg => 
        !processedIds.has(msg.messageId) && 
        !processedKeys.has(`${msg.agentId}-${msg.round}`)
      )
      .map(msg => ({
        ...msg,
        messageId: msg.messageId || `msg-${Date.now()}-${Math.random()}`
      }))

    const allNew = [...userInterrupts, ...newMessages]

    if (allNew.length > 0) {
      setQueue(prev => [...prev, ...allNew])
    }
  }, [messages, interrupts, displayedMessages])

  useEffect(() => {
    if (queue.length === 0 || processingRef.current) return

    processingRef.current = true
    setIsProcessing(true)

    let timeoutId = null

    const processNextItem = async () => {
      if (isCancelledRef.current || queue.length === 0) {
        processingRef.current = false
        setIsProcessing(false)
        return
      }

      const nextItem = queue[0]

      setCurrentSpeaker(nextItem.agentId || null)
      setIsUserSpeaking(nextItem.isUser || false)

      if (nextItem.isUser) {
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, 300)
        })
      }

      if (isCancelledRef.current) {
        processingRef.current = false
        setIsProcessing(false)
        return
      }

      setDisplayedMessages(prev => [...prev, nextItem])
      setQueue(prev => prev.slice(1))

      const delayBetween = nextItem.isUser ? 800 : 1500
      await new Promise(resolve => {
        timeoutId = setTimeout(resolve, delayBetween)
      })

      if (isCancelledRef.current) {
        processingRef.current = false
        setIsProcessing(false)
        return
      }

      setCurrentSpeaker(null)
      setIsUserSpeaking(false)
      processingRef.current = false
      setIsProcessing(false)
    }

    processNextItem()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      isCancelledRef.current = true
      processingRef.current = false
    }
  }, [queue])

  const activeSpeakerName = currentSpeaker
    ? displayedMessages.find(m => m.agentId === currentSpeaker)?.name || 'Agent'
    : null

  return (
    <div ref={containerRef} style={getContainerStyle()}>
      {displayedMessages.length === 0 && queue.length === 0 ? (
        <div style={{
          color: '#666',
          textAlign: 'center',
          padding: '32px',
          fontSize: '12px'
        }}>
          Enter a topic to start debate
        </div>
      ) : (
        <>
          {displayedMessages.map((msg, idx) => (
            <AgentBubble
              key={msg.messageId || `msg-${idx}`}
              name={msg.name}
              message={msg.message}
              color={msg.color || AGENT_COLORS.green}
              chaosLevel={chaosLevel}
              maxWidth={MESSAGE_MAX_WIDTH}
              isUser={msg.isUser}
            />
          ))}

          {isProcessing && currentSpeaker && !isUserSpeaking && (
            <div style={{
              color: '#00bfff',
              fontSize: '10px',
              fontFamily: "'Press Start 2P', monospace",
              textAlign: 'center',
              padding: '8px',
              animation: 'blink 0.5s infinite'
            }}>
              {activeSpeakerName} is thinking...
            </div>
          )}

          {isUserSpeaking && (
            <div style={{
              color: '#ffff00',
              fontSize: '10px',
              fontFamily: "'Press Start 2P', monospace",
              textAlign: 'center',
              padding: '8px',
              animation: 'blink 0.5s infinite'
            }}>
              YOU are speaking...
            </div>
          )}
        </>
      )}

      <div ref={messagesEndRef} style={{ height: '1px' }} />
    </div>
  )
}

export default ChatWindow