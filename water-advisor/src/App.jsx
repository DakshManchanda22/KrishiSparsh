import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WaterAdvisor from './pages/WaterAdvisor'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WaterAdvisor />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
