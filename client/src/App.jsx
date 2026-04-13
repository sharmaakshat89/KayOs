import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import DebateRoom from './pages/DebateRoom'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/debate/:id" element={<DebateRoom />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App