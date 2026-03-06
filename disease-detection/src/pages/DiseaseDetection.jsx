import { useState, useRef } from 'react'

const API_URL = import.meta.env.VITE_DISEASE_API_URL || 'https://plant-disease-api-f7nm.onrender.com'

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
        throw new Error(text || `Request failed (${res.status})`)
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
          <a href="/" className="site-nav-logo">कृषिSparsh</a>
          <nav className="site-nav-links">
            <a href="/disease-detection/" className="active">Disease Detection</a>
            <a href="/water-advisor/">Water Advisor</a>
            <a href="/expenses/">Expenses</a>
            <a href="/#schemes">Schemes</a>
          </nav>
        </div>
      </header>

      <main className="page-container">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
          Plant Disease Detection
        </h1>
        <p style={{ marginBottom: '1.5rem', color: 'rgba(255,255,255,0.95)' }}>
          Upload a leaf or plant image to detect possible disease using AI.
        </p>

        <div className="card">
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
                  style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: '0.5rem' }}
                />
              </div>
            ) : null}
            <p style={{ margin: 0, color: 'var(--primary)' }}>
              {file ? 'Click or drag a new image to replace' : 'Click or drag an image here'}
            </p>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={predict}
              disabled={loading || !file}
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
            <div className="card" style={{ marginTop: '1rem', background: 'rgba(111, 135, 75, 0.08)' }}>
              <p className="result-disease">{result.disease}</p>
              <p className="result-confidence">
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
