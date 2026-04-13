import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import PixelFrame from '../components/PixelFrame'

const API_URL = import.meta.env.VITE_API_URL || ''

function Home() {
  const [status, setStatus] = useState('')
  const [checking, setChecking] = useState(false)
  const navigate = useNavigate()

  const testConnection = async () => {
    setChecking(true)
    try {
      const healthRes = await axios.get(`${API_URL}/health`, { timeout: 5000 })
      setStatus(`Backend OK - ${healthRes.data.timestamp}`)
    } catch (err) {
      try {
        const res = await axios.get(`${API_URL}/api/debate/test`)
        setStatus(res.data.message)
      } catch (err2) {
        setStatus('Backend not connected')
      }
    }
    setChecking(false)
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '32px', textAlign: 'center' }}>
        Pixel Debate Arena
      </h1>
      
      <PixelFrame borderColor="blue">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button onClick={testConnection} disabled={checking}>
            {checking ? 'Checking...' : 'Test Backend Connection'}
          </button>
          {status && (
            <div style={{ color: status.includes('OK') ? '#00ff9f' : '#ff4444', fontSize: '12px' }}>
              {status}
            </div>
          )}
          <button onClick={() => navigate('/debate/test-session')}>
            Enter Debate Room
          </button>
        </div>
      </PixelFrame>
    </div>
  )
}

export default Home