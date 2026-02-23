import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const CROPS = [
  { value: 'rice', label: 'Rice' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'tomato', label: 'Tomato' },
  { value: 'sugarcane', label: 'Sugarcane' },
]

const STAGES = [
  { id: 'just_planted', label: 'Just Planted', range: '0–10 days', emoji: '🌱' },
  { id: 'growing_leaves', label: 'Growing Leaves', range: '10–30 days', emoji: '🌿' },
  { id: 'flowering', label: 'Flowering', range: '30–60 days', emoji: '🌸' },
  { id: 'fruiting', label: 'Fruiting', range: '60+ days', emoji: '🍅' },
]

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
}

export default function WaterAdvisor() {
  const [crop, setCrop] = useState('rice')
  const [stage, setStage] = useState(null)
  const [lat, setLat] = useState(null)
  const [lon, setLon] = useState(null)
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')
  const [locationError, setLocationError] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [appliedFeedback, setAppliedFeedback] = useState(false)

  const useLocation = () => {
    setLocationError(null)
    setLocationLoading(true)
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      setLocationLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLon(pos.coords.longitude)
        setManualLat(String(pos.coords.latitude.toFixed(5)))
        setManualLon(String(pos.coords.longitude.toFixed(5)))
        setLocationLoading(false)
      },
      (err) => {
        setLocationError(err.message || 'Permission denied. Enter coordinates manually.')
        setLat(null)
        setLon(null)
        setLocationLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const applyManualCoords = () => {
    const latNum = parseFloat(manualLat)
    const lonNum = parseFloat(manualLon)
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      setLocationError('Enter valid latitude and longitude.')
      setAppliedFeedback(false)
      return
    }
    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      setLocationError('Latitude must be -90 to 90. Longitude must be -180 to 180.')
      setAppliedFeedback(false)
      return
    }
    setLat(latNum)
    setLon(lonNum)
    setLocationError(null)
    setError(null)
    setAppliedFeedback(true)
    setTimeout(() => setAppliedFeedback(false), 2000)
  }

  const currentLat = lat ?? (manualLat ? parseFloat(manualLat) : null)
  const currentLon = lon ?? (manualLon ? parseFloat(manualLon) : null)

  const getAdvice = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel (or .env).')
      return
    }
    if (!stage) {
      setError('Please select a crop stage.')
      return
    }
    const useLat = currentLat
    const useLon = currentLon
    if (useLat == null || useLon == null || !Number.isFinite(useLat) || !Number.isFinite(useLon)) {
      setError('Please set your location (Use current location or enter latitude/longitude, then click Apply).')
      return
    }
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('getWeather', {
        body: { lat: useLat, lon: useLon, crop, stage },
      })
      if (fnError) {
        const msg = fnError.message || (fnError.context?.body?.error) || String(fnError)
        throw new Error(msg)
      }
      if (data?.error) throw new Error(data.error)
      if (!data || typeof data.todayWater === 'undefined') {
        throw new Error('Invalid response from server. Check Supabase Edge Function and OpenWeather API key.')
      }
      setResult(data)
    } catch (err) {
      const message = err?.message || 'Failed to get advice. Try again.'
      setError(message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* 1. Heading */}
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
          Smart Water Advisor
        </h1>
        <p style={{ margin: 0, fontSize: '1rem', color: '#2d5a27' }}>
          Get irrigation advice based on weather and crop stage.
        </p>
      </section>

      {/* 2. Crop dropdown */}
      <section style={sectionStyle}>
        <label htmlFor="crop-select" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Crop
        </label>
        <select
          id="crop-select"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          aria-label="Select crop type"
          style={{
            ...buttonBase,
            width: '100%',
            maxWidth: '320px',
            background: '#FFDC97',
            color: '#1a3d16',
            fontSize: '1rem',
          }}
        >
          {CROPS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </section>

      {/* 3. Crop stage cards */}
      <section style={sectionStyle}>
        <p style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>Crop stage</p>
        <div
          role="group"
          aria-label="Crop stage selection"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            gap: '0.75rem',
          }}
          className="stage-grid"
        >
          {STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={stage === s.id}
              aria-label={`${s.label}, ${s.range}`}
              onClick={() => setStage(s.id)}
              style={{
                ...buttonBase,
                background: stage === s.id ? '#A8EB9D' : '#FFE5BC',
                color: '#1a3d16',
                textAlign: 'left',
                padding: '1rem',
                borderColor: stage === s.id ? '#1a3d16' : '#2d5a27',
                boxShadow: stage === s.id ? '4px 4px 0 rgba(26, 61, 22, 0.4)' : '4px 4px 0 rgba(45, 90, 39, 0.3)',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'translate(2px, 2px)'}
              onMouseUp={(e) => e.currentTarget.style.transform = ''}
              onMouseLeave={(e) => e.currentTarget.style.transform = ''}
            >
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{s.emoji}</span>
              <span style={{ fontWeight: 'bold' }}>{s.label}</span>
              <span style={{ display: 'block', fontSize: '0.9rem', opacity: 0.9, marginTop: '0.25rem' }}>
                {s.range}
              </span>
            </button>
          ))}
        </div>
      </section>

      <style>{`
        @media (min-width: 600px) {
          .stage-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 900px) {
          .stage-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>

      {/* 4. Location */}
      <section style={sectionStyle}>
        <p style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>Location</p>
        <button
          type="button"
          onClick={useLocation}
          disabled={locationLoading}
          aria-label="Use my current location"
          style={{
            ...buttonBase,
            background: '#CCEEA6',
            color: '#1a3d16',
            marginBottom: '1rem',
            width: '100%',
            maxWidth: '320px',
          }}
        >
          {locationLoading ? 'Getting location…' : '📍 Use My Current Location'}
        </button>
        {locationError && (
          <p style={{ color: '#b45309', marginBottom: '0.75rem', fontWeight: '500' }}>{locationError}</p>
        )}
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Or enter coordinates:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <label htmlFor="manual-lat" className="sr-only">Latitude</label>
          <input
            id="manual-lat"
            type="text"
            inputMode="decimal"
            placeholder="Latitude"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '4px solid #2d5a27',
              borderRadius: '8px',
              maxWidth: '140px',
              fontSize: '1rem',
            }}
          />
          <label htmlFor="manual-lon" className="sr-only">Longitude</label>
          <input
            id="manual-lon"
            type="text"
            inputMode="decimal"
            placeholder="Longitude"
            value={manualLon}
            onChange={(e) => setManualLon(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '4px solid #2d5a27',
              borderRadius: '8px',
              maxWidth: '140px',
              fontSize: '1rem',
            }}
          />
          <button
            type="button"
            onClick={applyManualCoords}
            style={{
              ...buttonBase,
              background: appliedFeedback ? '#A8EB9D' : '#FFDC97',
              color: '#1a3d16',
              padding: '10px 16px',
            }}
          >
            {appliedFeedback ? '✓ Applied' : 'Apply'}
          </button>
        </div>
        {appliedFeedback && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#2d5a27', fontWeight: '500' }}>
            Coordinates applied. You can now click &quot;Get irrigation advice&quot;.
          </p>
        )}
        {(currentLat != null && currentLon != null) && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#2d5a27' }}>
            Coordinates: {Number(currentLat).toFixed(5)}, {Number(currentLon).toFixed(5)}
          </p>
        )}
      </section>

      {/* 5. Get Advice button */}
      <section style={sectionStyle}>
        <button
          type="button"
          onClick={getAdvice}
          disabled={loading}
          aria-busy={loading}
          style={{
            ...buttonBase,
            background: '#99E194',
            color: '#1a3d16',
            width: '100%',
            maxWidth: '320px',
            fontSize: '1.1rem',
          }}
        >
          {loading ? 'Getting advice…' : 'Get irrigation advice'}
        </button>
        {error && (
          <p style={{ color: '#b45309', marginTop: '0.75rem', fontWeight: '500' }} role="alert">{error}</p>
        )}
      </section>

      {/* 6. Result card */}
      {loading && (
        <section style={{ ...sectionStyle, textAlign: 'center', padding: '2rem' }}>
          <div
            role="status"
            aria-label="Loading"
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #CCEEA6',
              borderTopColor: '#2d5a27',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 0.5rem',
            }}
          />
          <p style={{ margin: 0 }}>Fetching weather and calculating advice…</p>
        </section>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      `}</style>

      {result && !loading && (
        <section
          style={{
            ...sectionStyle,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <h2 style={{ fontFamily: "var(--font-pixel), monospace", fontSize: '0.875rem', marginTop: 0 }}>
            Your advice
          </h2>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem' }}>🌊 Today's water required</p>
            <p style={{ margin: 0, fontSize: '1.25rem' }}>{Number(result.todayWater).toLocaleString()} L/acre</p>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem' }}>📅 Tomorrow's recommendation</p>
            <p style={{ margin: 0 }}>{Number(result.tomorrowWater).toLocaleString()} L/acre</p>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem' }}>🌤 Weather summary</p>
            <p style={{ margin: 0 }}>{result.weatherSummary}</p>
          </div>
          {result.warning && (
            <div
              role="alert"
              style={{
                background: '#FFC784',
                border: '4px solid #b45309',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '0.5rem',
              }}
            >
              <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem' }}>⚠ Warning</p>
              <p style={{ margin: 0 }}>{result.warning}</p>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
