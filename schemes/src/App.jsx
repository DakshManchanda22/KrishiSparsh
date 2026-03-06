import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SchemesChat from './pages/SchemesChat'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || ''

function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<SchemesChat />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
