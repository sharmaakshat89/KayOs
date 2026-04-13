import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: '#1a0a0a',
          border: '4px solid #ff0055',
          margin: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#ff0055', fontSize: '16px', marginBottom: '16px' }}>
            SYSTEM CRASH
          </h2>
          <p style={{ color: '#ff6666', fontSize: '12px', marginBottom: '16px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#ff0055',
              border: 'none',
              color: '#fff',
              padding: '12px 24px',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            RELOAD SYSTEM
          </button>
        </div>
      )
    }
    return this.props.children
  }
}