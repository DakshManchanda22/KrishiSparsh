import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const WaterAdvisor = lazy(() => import('./pages/WaterAdvisor'))

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || ''

function LoadingFallback() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      color: 'var(--green-dark, #1a3d16)',
      fontFamily: 'var(--font-pixel), monospace',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(45,90,39,0.3)',
        borderTopColor: '#2d5a27',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span>Loading…</span>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename={basename}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<WaterAdvisor />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
