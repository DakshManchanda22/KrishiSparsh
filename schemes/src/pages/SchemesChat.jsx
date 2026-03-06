import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || ''

const STATES = [
  'Andhra Pradesh', 'Bihar', 'Gujarat', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Uttar Pradesh', 'West Bengal',
  'Haryana', 'Odisha', 'Telangana', 'Assam', 'Chhattisgarh', 'Jharkhand', 'Other'
]

const QUESTIONS = [
  { id: 'state', text: 'Which state is your farm in?', type: 'choice', options: STATES },
  { id: 'district', text: 'Which district is your farm in?', type: 'text', placeholder: 'e.g. Ahmednagar' },
  { id: 'land_own', text: 'Do you own the land you farm?', type: 'choice', options: ['Yes', 'No', 'Rent'] },
  { id: 'land_size', text: 'How much land do you farm?', type: 'choice', options: ['Less than 1 acre', '1–2 acres', '2–5 acres', '5+ acres'] },
  { id: 'irrigation', text: 'Do you have irrigation on your farm?', type: 'choice', options: ['Yes', 'No', 'Rain only'] },
  { id: 'water_source', text: 'How do you water your crops?', type: 'choice', options: ['Canal', 'Borewell', 'Drip', 'Rain'] },
  { id: 'main_crop', text: 'What crop do you grow most?', type: 'choice', options: ['Rice', 'Wheat', 'Cotton', 'Vegetables', 'Other'] },
  { id: 'crops_per_year', text: 'How many crops per year?', type: 'choice', options: ['1', '2', '3'] },
  { id: 'pm_kisan', text: 'Do you get PM-KISAN money?', type: 'choice', options: ['Yes', 'No', 'Don\'t know'] },
  { id: 'kcc', text: 'Do you have a Kisan Credit Card?', type: 'choice', options: ['Yes', 'No'] },
  { id: 'tractor', text: 'Do you own a tractor or farm machine?', type: 'choice', options: ['Yes', 'No'] },
  { id: 'solar_pump', text: 'Would you like a solar pump subsidy?', type: 'choice', options: ['Yes', 'No', 'Maybe'] },
  { id: 'livestock', text: 'Do you have cows, goats or poultry?', type: 'choice', options: ['Yes', 'No'] },
  { id: 'crop_insurance', text: 'Do you have crop insurance?', type: 'choice', options: ['Yes', 'No', 'Don\'t know'] },
]

export default function SchemesChat() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [textInput, setTextInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const current = QUESTIONS[step]
  const isLast = step === QUESTIONS.length - 1
  const isDone = step >= QUESTIONS.length

  const submitChoice = (value) => {
    const next = { ...answers, [current.id]: value }
    setAnswers(next)
    setTextInput('')
    if (isLast) {
      fetchSuggestions(next)
    } else {
      setStep(step + 1)
    }
  }

  const submitText = () => {
    const value = textInput.trim()
    if (!value) return
    const next = { ...answers, [current.id]: value }
    setAnswers(next)
    setTextInput('')
    if (isLast) {
      fetchSuggestions(next)
    } else {
      setStep(step + 1)
    }
  }

  const fetchSuggestions = async (finalAnswers) => {
    setLoading(true)
    setError(null)
    try {
      const url = API_BASE ? `${API_BASE}/api/schemes-advice` : '/api/schemes-advice'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || `Request failed (${res.status})`)
      }
      const data = await res.json()
      setResult(data.text || data.response || 'No suggestions returned.')
      setStep(QUESTIONS.length)
    } catch (err) {
      setError(err.message || 'Could not get scheme suggestions. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="site-nav">
        <div className="site-nav-inner">
          <a href="/" className="site-nav-logo">कृषिSparsh</a>
          <nav className="site-nav-links">
            <a href="/disease-detection/">Disease Detection</a>
            <a href="/water-advisor/">Water Advisor</a>
            <a href="/expenses/">Expenses</a>
            <a href="/schemes/" className="active">Schemes</a>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '560px', margin: '0 auto' }}>
        <section className="chat-section" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <h1
            style={{
              fontFamily: "var(--font-pixel), monospace",
              fontSize: 'clamp(0.75rem, 3vw, 1rem)',
              color: '#1a3d16',
              margin: '0 0 0.5rem',
              lineHeight: 1.5,
            }}
          >
            Scheme Finder
          </h1>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#2d5a27' }}>
            Answer a few questions. We will suggest government schemes that may help you.
          </p>
        </section>

        {loading && (
          <section className="chat-section">
            <p className="chat-loading">Finding schemes for you…</p>
          </section>
        )}

        {error && <section className="chat-section"><p className="error-msg">{error}</p></section>}

        {!loading && !isDone && current && (
          <section className="chat-section">
            <p className="chat-question">{current.text}</p>
            {current.type === 'text' ? (
              <>
                <input
                  type="text"
                  className="chat-input"
                  placeholder={current.placeholder || ''}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitText()}
                  autoFocus
                />
                <button
                  type="button"
                  className="chat-option-btn"
                  onClick={submitText}
                  disabled={!textInput.trim()}
                >
                  Next
                </button>
              </>
            ) : (
              <div className="chat-options">
                {current.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="chat-option-btn"
                    onClick={() => submitChoice(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {!loading && result && (
          <section className="chat-section">
            <p className="chat-question">Schemes that may help you:</p>
            <p className="chat-response">{result}</p>
          </section>
        )}
      </main>
    </>
  )
}
