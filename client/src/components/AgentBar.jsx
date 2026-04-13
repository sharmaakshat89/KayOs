const AGENT_COLORS = {
  green: '#00ff9f',
  blue: '#00bfff',
  yellow: '#ffff00',
  red: '#ff0055',
  purple: '#aa55ff',
  orange: '#ffaa00'
}

function AgentBar({ agents = [], currentSpeaker = null, isUserSpeaking = false }) {
  const getBorderStyle = (agentId, color) => {
    const isActive = currentSpeaker === agentId || (isUserSpeaking && currentSpeaker === null)
    const baseColor = AGENT_COLORS[color] || AGENT_COLORS.green

    if (isActive) {
      return {
        border: `4px solid ${baseColor}`,
        boxShadow: `0 0 12px ${baseColor}, 0 0 24px ${baseColor}`,
        opacity: 1,
        transition: 'all 0.3s ease',
        animation: 'glow 1s infinite'
      }
    }

    return {
      border: `4px solid rgba(80, 80, 80, 0.5)`,
      boxShadow: 'none',
      opacity: 0.5,
      transition: 'all 0.3s ease'
    }
  }

  const getTextStyle = (agentId, color) => {
    const isActive = currentSpeaker === agentId || (isUserSpeaking && currentSpeaker === null)
    const baseColor = AGENT_COLORS[color] || AGENT_COLORS.green

    return {
      color: isActive ? baseColor : '#666',
      textShadow: isActive
        ? `0 0 4px ${baseColor}, 0 0 8px ${baseColor}`
        : 'none',
      fontSize: '10px',
      marginBottom: '8px',
      fontWeight: isActive ? 'bold' : 'normal',
      textTransform: 'uppercase',
      transition: 'all 0.3s ease'
    }
  }

  const getAvatarStyle = (agentId, color) => {
    const isActive = currentSpeaker === agentId || (isUserSpeaking && currentSpeaker === null)
    const baseColor = AGENT_COLORS[color] || AGENT_COLORS.green

    return {
      width: '64px',
      height: '64px',
      marginBottom: '8px',
      imageRendering: 'pixelated',
      border: `3px solid ${isActive ? baseColor : '#333'}`,
      background: '#0f0f0f',
      boxShadow: isActive ? `0 0 8px ${baseColor}` : 'none',
      transition: 'all 0.3s ease',
      opacity: isActive ? 1 : 0.6
    }
  }

  if (!agents || agents.length === 0) {
    return null
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(agents.length, 4)}, 1fr)`,
      gap: '16px',
      padding: '16px',
      border: '4px solid #00bfff',
      background: '#0f0f0f'
    }}>
      {agents.map((agent, idx) => {
        const isSpeaking = currentSpeaker === agent.id
        const avatarUrl = agent.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${agent.id || agent.name}`

        return (
          <div
            key={agent.id || idx}
            style={{
              ...getBorderStyle(agent.id, agent.color),
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#1a1a1a'
            }}
          >
            <div style={getAvatarStyle(agent.id, agent.color)}>
              <img
                src={avatarUrl}
                alt={agent.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  imageRendering: 'pixelated'
                }}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div style={{
                display: 'none',
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1a1a1a',
                color: AGENT_COLORS[agent.color] || AGENT_COLORS.green,
                fontSize: '24px'
              }}>
                {agent.name?.charAt(0) || '?'}
              </div>
            </div>

            <div style={getTextStyle(agent.id, agent.color)}>
              {agent.name}
            </div>

            {isSpeaking && (
              <div style={{
                color: '#ffff00',
                fontSize: '8px',
                marginTop: '8px',
                animation: 'blink 0.5s infinite',
                textShadow: '0 0 4px #ffff00'
              }}>
                SPEAKING...
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default AgentBar