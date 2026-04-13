import React, { useState, useEffect, useRef, useCallback } from 'react'

const AGENT_COLORS = {
  green: '#00ff9f',
  blue: '#00bfff',
  yellow: '#ffff00',
  red: '#ff0055',
  purple: '#aa55ff',
  orange: '#ffaa00'
}

const TYPE_SPEED = 30
const MESSAGE_MAX_WIDTH = 480

const AgentBubble = React.memo(function AgentBubble({ 
  name, 
  message, 
  color = 'green', 
  onComplete = null, 
  chaosLevel = 50,
  maxWidth = MESSAGE_MAX_WIDTH,
  isUser = false
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [showCursor, setShowCursor] = useState(true)
  const timeoutRef = useRef(null)
  const cursorIntervalRef = useRef(null)

  const borderColor = AGENT_COLORS[color] || AGENT_COLORS.green

  const getChaosBorderStyle = useCallback(() => {
    if (chaosLevel >= 80) {
      return {
        borderColor: '#ff0055',
        animation: 'chaosGlow 0.3s infinite'
      }
    } else if (chaosLevel >= 60) {
      return {
        borderColor: '#ff6600'
      }
    } else if (chaosLevel >= 30) {
      return {
        borderColor: '#ffaa00'
      }
    }
    return { borderColor }
  }, [chaosLevel, borderColor])

  useEffect(() => {
    if (!message) return

    setDisplayedText('')
    setIsTyping(true)

    let charIndex = 0
    const text = message

    const typeNextChar = () => {
      if (charIndex < text.length) {
        const char = text[charIndex]

        let delay = TYPE_SPEED

        if (['.', '!', '?'].includes(char)) {
          delay = TYPE_SPEED * 8
        } else if ([',', ';', ':'].includes(char)) {
          delay = TYPE_SPEED * 4
        } else if (char === ' ') {
          delay = TYPE_SPEED / 2
        }

        setDisplayedText(prev => prev + char)
        charIndex++

        timeoutRef.current = setTimeout(typeNextChar, delay)
      } else {
        setIsTyping(false)
        if (onComplete) {
          onComplete()
        }
      }
    }

    cursorIntervalRef.current = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 600)

    typeNextChar()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current)
    }
  }, [message, onComplete])

  const isUserMessage = name === 'YOU' || isUser

  const nameStyle = {
    color: isUserMessage ? '#ffff00' : borderColor,
    fontSize: '12px',
    marginBottom: '8px',
    fontWeight: 'bold',
    textShadow: `0 0 4px ${isUserMessage ? '#ffff00' : borderColor}`,
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }

  const messageStyle = {
    color: '#ffffff',
    fontSize: isUserMessage ? '11px' : '10px',
    lineHeight: '1.8',
    letterSpacing: '0.5px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '300px',
    overflowY: 'auto',
    fontFamily: isUserMessage 
      ? "'Press Start 2P', monospace" 
      : "'Press Start 2P', monospace"
  }

  const bubbleStyle = {
    border: `4px solid ${isUserMessage ? '#ffff00' : borderColor}`,
    padding: '16px 20px',
    background: isUserMessage ? '#1a1a00' : '#0f0f0f',
    position: 'relative',
    maxWidth: maxWidth,
    width: '100%',
    boxShadow: isUserMessage 
      ? '0 0 8px rgba(255, 255, 0, 0.3), inset 0 0 20px rgba(255, 255, 0, 0.05)'
      : 'none',
    ...getChaosBorderStyle()
  }

  return (
    <div style={bubbleStyle}>
      <div style={nameStyle}>
        {isUserMessage && (
          <span style={{
            background: '#ffff00',
            color: '#000',
            fontSize: '8px',
            padding: '2px 6px',
            border: '2px solid #000'
          }}>
            YOU
          </span>
        )}
        <span>{name}</span>
      </div>

      <div style={messageStyle}>
        {displayedText}
        {isTyping && showCursor && (
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '14px',
            background: isUserMessage ? '#ffff00' : borderColor,
            marginLeft: '2px',
            verticalAlign: 'text-bottom'
          }} />
        )}
      </div>
    </div>
  )
})

export default AgentBubble