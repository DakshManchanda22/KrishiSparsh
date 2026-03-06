import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DiseaseDetection from './pages/DiseaseDetection'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || ''

function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<DiseaseDetection />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
