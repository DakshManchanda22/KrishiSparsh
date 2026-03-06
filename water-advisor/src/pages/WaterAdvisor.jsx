import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const LANG_KEY = 'krishisparsh_lang'
const TRANSLATIONS = {
  en: {
    title: 'Smart Water Advisor',
    subtitle: 'Get irrigation advice based on weather and crop stage.',
    crop: 'Crop',
    cropStage: 'Crop stage',
    location: 'Location',
    useLocation: 'Use My Current Location',
    gettingLocation: 'Getting location…',
    orCoords: 'Or enter coordinates:',
    latitude: 'Latitude',
    longitude: 'Longitude',
    apply: 'Apply',
    applied: '✓ Applied',
    appliedHint: 'Coordinates applied. You can now click "Get irrigation advice".',
    getAdvice: 'Get irrigation advice',
    gettingAdvice: 'Getting advice…',
    yourAdvice: 'Your advice',
    todayWater: "Today's water required",
    tomorrowWater: "Tomorrow's recommendation",
    weatherSummary: 'Weather summary',
    warning: 'Warning',
    fetching: 'Fetching weather and calculating advice…',
    home: 'कृषिSparsh',
    langBtn: 'हिंदी',
    navDisease: 'Disease Detection',
    navWater: 'Water Advisor',
    navExpenses: 'Expenses',
    navSchemes: 'Schemes',
    navJoin: 'Join Now',
  },
  hi: {
    title: 'स्मार्ट जल सलाहकार',
    subtitle: 'मौसम और फसल अवस्था के आधार पर सिंचाई सलाह पाएं।',
    crop: 'फसल',
    cropStage: 'फसल अवस्था',
    location: 'स्थान',
    useLocation: 'मेरा वर्तमान स्थान इस्तेमाल करें',
    gettingLocation: 'स्थान मिल रहा है…',
    orCoords: 'या अक्षांश/देशांतर दर्ज करें:',
    latitude: 'अक्षांश',
    longitude: 'देशांतर',
    apply: 'लागू करें',
    applied: '✓ लागू',
    appliedHint: 'निर्देशांक लागू। अब "सिंचाई सलाह पाएं" पर क्लिक करें।',
    getAdvice: 'सिंचाई सलाह पाएं',
    gettingAdvice: 'सलाह मिल रही है…',
    yourAdvice: 'आपकी सलाह',
    todayWater: 'आज पानी की जरूरत',
    tomorrowWater: 'कल की सिफारिश',
    weatherSummary: 'मौसम सारांश',
    warning: 'चेतावनी',
    fetching: 'मौसम और सलाह गणना हो रही है…',
    home: 'कृषिSparsh',
    langBtn: 'English',
    navDisease: 'रोग पहचान',
    navWater: 'जल सलाहकार',
    navExpenses: 'खर्च',
    navSchemes: 'योजनाएं',
    navJoin: 'अभी जुड़ें',
  },
}

const CROPS = [
  { value: 'rice', label: 'Rice', labelHi: 'चावल' },
  { value: 'wheat', label: 'Wheat', labelHi: 'गेहूं' },
  { value: 'tomato', label: 'Tomato', labelHi: 'टमाटर' },
  { value: 'sugarcane', label: 'Sugarcane', labelHi: 'गन्ना' },
]

const STAGES = [
  { id: 'just_planted', label: 'Just Planted', labelHi: 'अभी लगाया', range: '0–10 days', rangeHi: '0–10 दिन', emoji: '🌱' },
  { id: 'growing_leaves', label: 'Growing Leaves', labelHi: 'पत्ते बढ़ रहे', range: '10–30 days', rangeHi: '10–30 दिन', emoji: '🌿' },
  { id: 'flowering', label: 'Flowering', labelHi: 'फूल आ रहे', range: '30–60 days', rangeHi: '30–60 दिन', emoji: '🌸' },
  { id: 'fruiting', label: 'Fruiting', labelHi: 'फल लग रहे', range: '60+ days', rangeHi: '60+ दिन', emoji: '🍅' },
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
  const [lang, setLangState] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(LANG_KEY) || 'en'
    return 'en'
  })
  const setLang = (l) => {
    setLangState(l)
    localStorage.setItem(LANG_KEY, l)
  }
  const t = (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key
  const isHi = lang === 'hi'

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
        const hint = msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('send')
          ? ' Check: Supabase URL and anon key in Vercel env, getWeather deployed, and CORS on the function.'
          : ''
        throw new Error(msg + hint)
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

  const homeHref = '/'
  const sectionHref = (hash) => (hash ? `/#${hash}` : '/water-advisor/')

  return (
    <>
      {/* Full site nav — same as landing page, so you can jump between pages without going home */}
      <header className="site-nav">
        <div className="site-nav-inner">
          <a href={homeHref} className="site-nav-logo" aria-label="Home">
            <span className="site-nav-logo-icon" aria-hidden="true">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8 2 5 5.5 5 9.5c0 4 3 8.5 7 12.5 4-4 7-8.5 7-12.5C19 5.5 16 2 12 2zm0 11c-1.4 0-2.5-1.1-2.5-2.5S10.6 8 12 8s2.5 1.1 2.5 2.5S13.4 13 12 13z"/></svg>
            </span>
            <span className="site-nav-logo-text">{t('home')}</span>
          </a>

          <nav className="site-nav-links" aria-label="Main">
            <a href={sectionHref('disease')}>{t('navDisease')}</a>
            <a href="/water-advisor/" className="active">{t('navWater')}</a>
            <a href="/expenses/">{t('navExpenses')}</a>
            <a href={sectionHref('schemes')}>{t('navSchemes')}</a>
          </nav>

          <div className="site-nav-right">
            <button
              type="button"
              className="site-nav-join"
              onClick={() => setLang(isHi ? 'en' : 'hi')}
              aria-label={isHi ? 'Switch to English' : 'Switch to Hindi'}
            >
              {t('langBtn')}
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '80px' }}>
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
          {t('title')}
        </h1>
        <p style={{ margin: 0, fontSize: '1rem', color: '#2d5a27' }}>
          {t('subtitle')}
        </p>
      </section>

      {/* 2. Crop dropdown */}
      <section style={sectionStyle}>
        <label htmlFor="crop-select" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {t('crop')}
        </label>
        <select
          id="crop-select"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          aria-label={t('crop')}
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
            <option key={c.value} value={c.value}>{isHi ? c.labelHi : c.label}</option>
          ))}
        </select>
      </section>

      {/* 3. Crop stage cards */}
      <section style={sectionStyle}>
        <p style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>{t('cropStage')}</p>
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
              aria-label={`${isHi ? s.labelHi : s.label}, ${isHi ? s.rangeHi : s.range}`}
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
              <span style={{ fontWeight: 'bold' }}>{isHi ? s.labelHi : s.label}</span>
              <span style={{ display: 'block', fontSize: '0.9rem', opacity: 0.9, marginTop: '0.25rem' }}>
                {isHi ? s.rangeHi : s.range}
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
        <p style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>{t('location')}</p>
        <button
          type="button"
          onClick={useLocation}
          disabled={locationLoading}
          aria-label={t('useLocation')}
          style={{
            ...buttonBase,
            background: '#CCEEA6',
            color: '#1a3d16',
            marginBottom: '1rem',
            width: '100%',
            maxWidth: '320px',
          }}
        >
          {locationLoading ? t('gettingLocation') : '📍 ' + t('useLocation')}
        </button>
        {locationError && (
          <p style={{ color: '#b45309', marginBottom: '0.75rem', fontWeight: '500' }}>{locationError}</p>
        )}
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t('orCoords')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <label htmlFor="manual-lat" className="sr-only">{t('latitude')}</label>
          <input
            id="manual-lat"
            type="text"
            inputMode="decimal"
            placeholder={t('latitude')}
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
          <label htmlFor="manual-lon" className="sr-only">{t('longitude')}</label>
          <input
            id="manual-lon"
            type="text"
            inputMode="decimal"
            placeholder={t('longitude')}
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
          {loading ? t('gettingAdvice') : t('getAdvice')}
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
          <p style={{ margin: 0 }}>{t('fetching')}</p>
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
            {t('yourAdvice')}
          </h2>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem' }}>{t('todayWater')}</p>
            <p style={{ margin: 0, fontSize: '1.25rem' }}>{Number(result.todayWater).toLocaleString()} L/acre</p>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem' }}>{t('tomorrowWater')}</p>
            <p style={{ margin: 0 }}>{Number(result.tomorrowWater).toLocaleString()} L/acre</p>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem' }}>🌤 {t('weatherSummary')}</p>
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
              <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem' }}>⚠ {t('warning')}</p>
              <p style={{ margin: 0 }}>{result.warning}</p>
            </div>
          )}
        </section>
      )}
    </main>
    </>
  )
}
