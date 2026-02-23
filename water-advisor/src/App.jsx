import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WaterAdvisor from './pages/WaterAdvisor'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || ''

function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<WaterAdvisor />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
