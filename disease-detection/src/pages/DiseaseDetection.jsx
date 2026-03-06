import { useState, useRef } from 'react'

const API_URL = import.meta.env.VITE_DISEASE_API_URL || 'https://plant-disease-api-f7nm.onrender.com'

const sectionStyle = {
  background: 'rgba(255, 255, 255, 0.6)',
  border: '4px solid #2d5a27',
  borderRadius: '8px',
  boxShadow: '4px 4px 0 rgba(45, 90, 39, 0.3)',
  padding: '1.25rem',
  marginBottom: '1.5rem',
}

const buttonBase = {
  padding: '12px 20px',
  minHeight: '44px',
  border: '4px solid #2d5a27',
  borderRadius: '8px',
  boxShadow: '4px 4px 0 rgba(45, 90, 39, 0.3)',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'transform 0.1s ease, box-shadow 0.1s ease',
  fontSize: '1rem',
}

export default function DiseaseDetection() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragover, setDragover] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return
    setError(null)
    setResult(null)
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p)
      return url
    })
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragover(false)
    handleFile(e.dataTransfer?.files?.[0])
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setDragover(true)
  }

  const onDragLeave = () => setDragover(false)

  const predict = async () => {
    if (!file) {
      setError('Please select an image first.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const text = await res.text()
        let msg = `Request failed (${res.status})`
        try {
          const j = JSON.parse(text)
          if (j.detail) msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail)
          if (j.error) msg += ': ' + j.error
        } catch {
          if (text) msg = text
        }
        throw new Error(msg)
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Failed to get prediction. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="site-nav">
        <div className="site-nav-inner">
          <a href="/" className="site-nav-logo" aria-label="Home">
            <span className="site-nav-logo-icon" aria-hidden="true">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8 2 5 5.5 5 9.5c0 4 3 8.5 7 12.5 4-4 7-8.5 7-12.5C19 5.5 16 2 12 2zm0 11c-1.4 0-2.5-1.1-2.5-2.5S10.6 8 12 8s2.5 1.1 2.5 2.5S13.4 13 12 13z"/></svg>
            </span>
            <span className="site-nav-logo-text">कृषिSparsh</span>
          </a>
          <nav className="site-nav-links">
            <a href="/disease-detection/" className="active">Disease Detection</a>
            <a href="/water-advisor/">Water Advisor</a>
            <a href="/expenses/">Expenses</a>
            <a href="/#schemes">Schemes</a>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '80px' }}>
        {/* Heading – same style as Water Advisor */}
        <section style={{ ...sectionStyle, textAlign: 'center', padding: '2rem 1rem' }}>
          <h1
            style={{
              fontFamily: "var(--font-pixel), 'Courier New', monospace",
              fontSize: 'clamp(1rem, 4vw, 1.5rem)',
              color: '#1a3d16',
              margin: '0 0 0.75rem',
              lineHeight: 1.6,
            }}
          >
            Plant Disease Detection
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: '#2d5a27' }}>
            Upload a leaf or plant image to detect possible disease using AI.
          </p>
        </section>

        {/* Upload & predict – Minecraft-style section */}
        <section style={sectionStyle}>
          <div
            className={`upload-zone ${dragover ? 'dragover' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {preview ? (
              <div style={{ marginBottom: '1rem' }}>
                <img
                  src={preview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: '8px', border: '2px solid #2d5a27' }}
                />
              </div>
            ) : null}
            <p style={{ margin: 0, color: '#1a3d16', fontWeight: 'bold' }}>
              {file ? 'Click or drag a new image to replace' : 'Click or drag an image here'}
            </p>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={predict}
              disabled={loading || !file}
              style={{
                ...buttonBase,
                background: '#A8EB9D',
                color: '#1a3d16',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translate(2px, 2px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = '')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="spinner" /> Analyzing…
                </span>
              ) : (
                'Detect disease'
              )}
            </button>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {result && (
            <div
              style={{
                ...sectionStyle,
                marginTop: '1rem',
                background: 'rgba(168, 235, 157, 0.5)',
                borderColor: '#1a3d16',
                boxShadow: '4px 4px 0 rgba(26, 61, 22, 0.4)',
              }}
            >
              <p className="result-disease">{result.disease}</p>
              <p className="result-confidence">
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
