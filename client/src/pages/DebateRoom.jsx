import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import ChatWindow from '../components/ChatWindow'
import ControlPanel from '../components/ControlPanel'
import PixelFrame from '../components/PixelFrame'
import AgentBar from '../components/AgentBar'
import useDebateStore from '../store/useDebateStore'

const POSITION_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3']

function DebateRoom() {
  const { id } = useParams()
  const {
    messages,
    interrupts,
    setSession,
    setTopic,
    setAgents,
    positions,
    isRunning,
    isRequestLocked,
    chaosLevel,
    currentRound,
    agents,
    interrupt,
    error,
    clearError
  } = useDebateStore()

  const [showInterruptFlash, setShowInterruptFlash] = useState(false)
  const [lastInterruptCount, setLastInterruptCount] = useState(0)
  const containerRef = useRef(null)

  const handleStartDebate = useCallback((topic) => {
    setSession(id)
    setTopic(topic)
  }, [id, setSession, setTopic])

  const handleInterrupt = useCallback(async (msg) => {
    setShowInterruptFlash(true)
    await interrupt(msg)
    setTimeout(() => setShowInterruptFlash(false), 900)
  }, [interrupt])

  useEffect(() => {
    if (interrupts.length > lastInterruptCount) {
      setShowInterruptFlash(true)
      setTimeout(() => setShowInterruptFlash(false), 900)
      setLastInterruptCount(interrupts.length)
    }
  }, [interrupts.length, lastInterruptCount])

  const getChaosBorderColor = useCallback(() => {
    if (chaosLevel >= 80) return '#ff0055'
    if (chaosLevel >= 60) return '#ff6600'
    if (chaosLevel >= 30) return '#ffaa00'
    return '#00ff9f'
  }, [chaosLevel])

  const getChaosBorderStyle = useCallback(() => {
    const color = getChaosBorderColor()

    if (chaosLevel >= 80) {
      return {
        borderColor: color,
        animation: 'chaosGlow 0.5s infinite'
      }
    }

    return { borderColor: color }
  }, [chaosLevel, getChaosBorderColor])

  const isThinking = isRunning || isRequestLocked

  return (
    <div
      ref={containerRef}
      style={{
        padding: '20px',
        maxWidth: '900px',
        margin: '0 auto',
        minHeight: '100vh'
      }}
    >
      {error && (
        <div style={{
          background: '#1a0a0a',
          border: '4px solid #ff0055',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <span style={{ 
            color: '#ff0055', 
            fontSize: '11px', 
            fontFamily: "'Press Start 2P', monospace" 
          }}>
            SYSTEM ERROR — {error.toUpperCase()}
          </span>
          <button
            onClick={clearError}
            style={{
              background: '#ff0055',
              border: '2px solid #ff0055',
              color: '#fff',
              padding: '8px 16px',
              fontSize: '9px',
              cursor: 'pointer',
              fontFamily: "'Press Start 2P', monospace"
            }}
          >
            RETRY?
          </button>
        </div>
      )}

      {isThinking && (
        <div style={{
          background: '#0a1a0a',
          border: '4px solid #00ff9f',
          padding: '10px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'pulse 1s infinite'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            background: '#00ff9f',
            animation: 'blink 0.5s infinite'
          }} />
          <span style={{ 
            color: '#00ff9f', 
            fontSize: '11px', 
            fontFamily: "'Press Start 2P', monospace" 
          }}>
            THINKING...
          </span>
        </div>
      )}

      <div
        style={{
          border: '4px solid #00bfff',
          padding: '12px 16px',
          marginBottom: '16px',
          background: '#0f0f0f',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <h1 style={{
          fontSize: '14px',
          color: '#00bfff',
          textShadow: '0 0 4px #00bfff',
          margin: 0
        }}>
          ROUND {currentRound}
        </h1>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '9px', color: '#666' }}>CHAOS:</span>
          <div style={{
            width: '100px',
            height: '16px',
            background: '#1a1a1a',
            border: '2px solid',
            borderColor: getChaosBorderColor()
          }}>
            <div style={{
              width: `${chaosLevel}%`,
              height: '100%',
              background: getChaosBorderColor(),
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{
            fontSize: '11px',
            color: getChaosBorderColor(),
            minWidth: '40px',
            textAlign: 'right'
          }}>
            {chaosLevel}%
          </span>
        </div>
      </div>

      {showInterruptFlash && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 0, 0.2)',
          border: '8px solid #ffff00',
          zIndex: 100,
          pointerEvents: 'none',
          animation: 'flash 0.3s ease-in-out 3'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#ffff00',
            color: '#000',
            padding: '16px 32px',
            fontSize: '14px',
            fontWeight: 'bold',
            fontFamily: "'Press Start 2P', monospace"
          }}>
            YOU INTERRUPTED!
          </div>
        </div>
      )}

      {positions.length > 0 && !isRunning && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          {positions.map((pos, idx) => (
            <div key={idx} style={{
              border: `4px solid ${POSITION_COLORS[idx]}`,
              padding: '12px',
              background: '#1a1a1a',
              imageRendering: 'pixelated'
            }}>
              <h3 style={{
                color: POSITION_COLORS[idx],
                fontSize: '10px',
                marginBottom: '8px',
                marginTop: 0,
                textTransform: 'uppercase'
              }}>
                {pos.title}
              </h3>
              <p style={{ color: '#888', fontSize: '8px', lineHeight: '1.6', margin: 0 }}>
                {pos.description}
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <AgentBar
          agents={agents}
          currentSpeaker={messages.length > 0 ? messages[messages.length - 1]?.agentId : null}
          isUserSpeaking={interrupts.length > 0}
        />
      </div>

      <div style={getChaosBorderStyle()}>
        <ChatWindow
          messages={messages}
          interrupts={interrupts}
          chaosLevel={chaosLevel}
        />
      </div>

      <div style={{ marginTop: '16px' }}>
        <ControlPanel
          onStartDebate={handleStartDebate}
          onInterrupt={handleInterrupt}
        />
      </div>
    </div>
  )
}

export default DebateRoom