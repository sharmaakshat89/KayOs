import { useState, useEffect, useCallback } from 'react'
import useDebateStore from '../store/useDebateStore'

const BUTTON_STYLES = {
  primary: {
    padding: '12px 20px',
    fontSize: '12px',
    minWidth: '140px',
    minHeight: '44px'
  },
  secondary: {
    padding: '10px 16px',
    fontSize: '10px',
    minWidth: '100px',
    minHeight: '36px'
  },
  small: {
    padding: '8px 12px',
    fontSize: '9px',
    minWidth: '80px',
    minHeight: '32px'
  }
}

function ControlPanel({ onStartDebate, onInterrupt }) {
  const [topicInput, setTopicInput] = useState('')
  const [availableModels, setAvailableModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [testPrompt, setTestPrompt] = useState('')
  const [testResult, setTestResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [startingDebate, setStartingDebate] = useState(false)
  const [interruptMsg, setInterruptMsg] = useState('')
  const [interrupting, setInterrupting] = useState(false)
  const [hoveredButton, setHoveredButton] = useState(null)

  const { chaosLevel, setChaosLevel, selectedModels, setSelectedModels, setAgents, setPositions, setSession, setError, error, clearError, nextRound, isRunning, isRequestLocked, currentRound, sessionId, interrupt, clearSession } = useDebateStore()

  const handleMouseEnter = useCallback((btnId) => setHoveredButton(btnId), [])
  const handleMouseLeave = useCallback(() => setHoveredButton(null), [])

  const getButtonStyle = useCallback((baseStyle, btnId) => ({
    ...baseStyle,
    border: '4px solid',
    background: hoveredButton === btnId ? '#ffdd00' : '#0f0f0f',
    color: hoveredButton === btnId ? '#000' : '#ffdd00',
    borderColor: hoveredButton === btnId ? '#ffdd00' : '#ffdd00',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    transform: hoveredButton === btnId ? 'scale(1.02)' : 'scale(1)',
    boxShadow: hoveredButton === btnId 
      ? '0 0 8px rgba(255, 221, 0, 0.5)' 
      : 'none'
  }), [hoveredButton])

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || '/api/debate'
    fetch(`${API_URL}/models`)
      .then(res => res.json())
      .then(data => setAvailableModels(data.models))
      .catch(err => console.error('Failed to fetch models:', err))
      .finally(() => setModelsLoading(false))
  }, [])

  const handleModelToggle = (model) => {
    if (selectedModels.includes(model)) {
      setSelectedModels(selectedModels.filter(m => m !== model))
    } else if (selectedModels.length < 4) {
      setSelectedModels([...selectedModels, model])
    }
  }

  const handleStart = async () => {
    if (!topicInput.trim() || selectedModels.length !== 4) {
      setError('Please enter a topic and select exactly 4 models')
      return
    }

    setStartingDebate(true)
    clearError()

    try {
      const res = await fetch('/api/debate/start-debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput.trim(),
          models: selectedModels
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start debate')
      }

      setSession(data.sessionId)
      setAgents(data.agents)
      setPositions(data.positions)
      onStartDebate(topicInput.trim())
      setTopicInput('')
    } catch (err) {
      setError(err.message)
    }

    setStartingDebate(false)
  }

  const handleTestCompletion = async () => {
    if (!selectedModels[0] || !testPrompt.trim()) return

    setLoading(true)
    setTestResult('')

    try {
      const res = await fetch('/api/debate/test-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModels[0],
          prompt: testPrompt
        })
      })
      const data = await res.json()
      setTestResult(data.response || data.error)
    } catch (err) {
      setTestResult('Error: ' + err.message)
    }

    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '20px',
      border: '4px solid #ffdd00',
      background: '#0f0f0f'
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
        <input
          type="text"
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
          placeholder="Enter debate topic..."
          style={{ 
            flex: 1, 
            minHeight: '44px',
            fontSize: '11px',
            padding: '10px 14px'
          }}
          disabled={startingDebate}
        />
        <button
          onClick={handleStart}
          disabled={startingDebate}
          onMouseEnter={() => handleMouseEnter('start')}
          onMouseLeave={handleMouseLeave}
          style={getButtonStyle(BUTTON_STYLES.primary, 'start')}
        >
          {startingDebate ? 'Starting...' : 'START DEBATE'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <label style={{ 
          fontSize: '10px', 
          color: '#ffdd00',
          minWidth: '100px'
        }}>
          CHAOS: {chaosLevel}
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={chaosLevel}
          onChange={(e) => setChaosLevel(parseInt(e.target.value))}
          style={{ 
            flex: 1,
            height: '16px',
            accentColor: '#ffdd00'
          }}
        />
        <span style={{
          fontSize: '12px',
          color: chaosLevel >= 80 ? '#ff0055' : chaosLevel >= 60 ? '#ff6600' : chaosLevel >= 30 ? '#ffaa00' : '#00ff9f',
          minWidth: '40px',
          textAlign: 'right'
        }}>
          {chaosLevel}%
        </span>
      </div>

      {sessionId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={nextRound}
            disabled={isRunning || isRequestLocked}
            onMouseEnter={() => handleMouseEnter('next')}
            onMouseLeave={handleMouseLeave}
            style={getButtonStyle(BUTTON_STYLES.secondary, 'next')}
          >
            {isRunning ? 'Running...' : 'NEXT ROUND'}
          </button>
          <button 
            onClick={() => {
              if (confirm('Restart debate with same settings?')) {
                clearSession()
              }
            }}
            onMouseEnter={() => handleMouseEnter('restart')}
            onMouseLeave={handleMouseLeave}
            style={getButtonStyle({ ...BUTTON_STYLES.small, background: '#222', color: '#888', borderColor: '#444' }, 'restart')}
          >
            RESTART
          </button>
          <button 
            onClick={() => {
              if (confirm('Start new debate? Current session will be lost.')) {
                clearSession()
                setTopicInput('')
              }
            }}
            onMouseEnter={() => handleMouseEnter('new')}
            onMouseLeave={handleMouseLeave}
            style={getButtonStyle({ ...BUTTON_STYLES.small, background: '#222', color: '#888', borderColor: '#444' }, 'new')}
          >
            NEW TOPIC
          </button>
        </div>
      )}

      <div style={{ border: '2px solid #444', padding: '16px' }}>
        <div style={{ 
          fontSize: '12px', 
          marginBottom: '12px', 
          color: '#ffdd00',
          fontWeight: 'bold'
        }}>
          SELECT MODELS ({selectedModels.length}/4):
        </div>
        {modelsLoading ? (
          <div style={{ color: '#666', fontSize: '10px', padding: '12px' }}>Loading models...</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {availableModels.map(model => (
              <button
                key={model}
                onClick={() => handleModelToggle(model)}
                onMouseEnter={() => handleMouseEnter(`model-${model}`)}
                onMouseLeave={handleMouseLeave}
                style={{
                  ...BUTTON_STYLES.secondary,
                  background: selectedModels.includes(model) ? '#ffdd00' : '#222',
                  color: selectedModels.includes(model) ? '#000' : '#fff',
                  border: '3px solid',
                  borderColor: selectedModels.includes(model) ? '#ffdd00' : '#444',
                  transform: hoveredButton === `model-${model}` ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.15s ease'
                }}
              >
                {model.split('/').pop()}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{ 
          color: '#ff4444', 
          fontSize: '11px', 
          padding: '12px', 
          border: '3px solid #ff4444',
          background: '#1a0a0a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>SYSTEM ERROR — {error.toUpperCase()}</span>
          <button 
            onClick={clearError} 
            style={{
              background: '#ff4444',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            DISMISS
          </button>
        </div>
      )}

      <div style={{ border: '2px solid #444', padding: '16px' }}>
        <div style={{ 
          fontSize: '12px', 
          marginBottom: '12px', 
          color: '#ff4444',
          fontWeight: 'bold'
        }}>
          TEST MODEL:
        </div>
        <input
          type="text"
          value={testPrompt}
          onChange={(e) => setTestPrompt(e.target.value)}
          placeholder='Prompt (e.g. "Say hello in an aggressive tone")'
          style={{ 
            width: '100%', 
            marginBottom: '12px',
            fontSize: '10px',
            padding: '10px'
          }}
        />
        <button 
          onClick={handleTestCompletion}
          disabled={loading || !selectedModels[0] || !testPrompt}
          onMouseEnter={() => handleMouseEnter('test')}
          onMouseLeave={handleMouseLeave}
          style={{
            ...getButtonStyle(BUTTON_STYLES.secondary, 'test'),
            background: loading ? '#444' : '#0f0f0f',
            color: loading ? '#666' : '#ff4444',
            borderColor: '#ff4444'
          }}
        >
          {loading ? 'Testing...' : 'TEST'}
        </button>
        {testResult && (
          <div style={{ 
            marginTop: '12px', 
            fontSize: '11px', 
            color: '#00ff00', 
            wordBreak: 'break-word',
            padding: '12px',
            border: '2px solid #00ff00',
            background: '#0a1a0a'
          }}>
            Result: {testResult}
          </div>
        )}
      </div>

      {sessionId && (
        <div style={{ border: '3px solid #ffff00', padding: '16px' }}>
          <div style={{ 
            fontSize: '12px', 
            marginBottom: '12px', 
            color: '#ffff00',
            fontWeight: 'bold'
          }}>
            INTERRUPT:
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={interruptMsg}
              onChange={(e) => {
                if (e.target.value.length <= 300) {
                  setInterruptMsg(e.target.value)
                }
              }}
              placeholder={`Your message... (${300 - interruptMsg.length} chars)`}
              style={{ 
                flex: 1,
                fontSize: '10px',
                padding: '10px'
              }}
              disabled={interrupting || isRequestLocked}
              maxLength={300}
            />
            <button
              onClick={async () => {
                if (!interruptMsg.trim()) return
                setInterrupting(true)
                await interrupt(interruptMsg)
                setInterruptMsg('')
                setInterrupting(false)
              }}
              disabled={interrupting || !interruptMsg.trim() || isRequestLocked}
              onMouseEnter={() => handleMouseEnter('interrupt')}
              onMouseLeave={handleMouseLeave}
              style={{
                ...getButtonStyle(BUTTON_STYLES.primary, 'interrupt'),
                background: interrupting ? '#444' : '#0f0f0f',
                color: interrupting ? '#666' : '#ffff00',
                borderColor: '#ffff00'
              }}
            >
              {interrupting ? 'Sending...' : 'INTERRUPT'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ControlPanel