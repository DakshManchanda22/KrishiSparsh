import { useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const CATEGORIES = ['fertilizer', 'seed', 'labour', 'pesticide', 'transport', 'other']
const CATEGORY_LABELS = {
  fertilizer: 'Fertilizer',
  seed: 'Seeds',
  labour: 'Labour',
  pesticide: 'Pesticide',
  transport: 'Transport',
  other: 'Other',
}
const RECOMMENDED_RANGES = {
  fertilizer: { min: 25, max: 35 },
  labour: { min: 20, max: 40 },
  seed: { min: 5, max: 15 },
  pesticide: { min: 5, max: 15 },
  transport: { min: 0, max: 100 },
  other: { min: 0, max: 100 },
}

const KEYWORDS = {
  fertilizer: ['fertilizer', 'fertiliser', 'urea', 'dap', 'npk', 'potash', 'manure', 'khad', 'उर्वरक'],
  seed: ['seed', 'seeds', 'bij', 'बीज'],
  labour: ['labour', 'labor', 'mazdoor', 'wage', 'wages', 'majuri', 'मजदूरी'],
  pesticide: ['pesticide', 'insecticide', 'spray', 'weedicide', 'कीटनाशक'],
  transport: ['transport', 'petrol', 'diesel', 'vehicle', 'truck', 'fuel', 'पेट्रोल', 'डीजल'],
}

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

function extractAmount(text) {
  if (!text || typeof text !== 'string') return null
  const normalized = text.replace(/,/g, '')
  const patterns = [
    /(?:total|amount|sum|grand total|rupees?|rs\.?|₹)\s*[:\s]*[\d.]+\s*(?:\.\d{2})?/i,
    /[\d,]+\.?\d{0,2}\s*(?:rupees?|rs\.?|₹)/i,
    /(?:total|amount)\s*[:\s]*(\d+(?:\.\d{2})?)/i,
    /(\d{2,}(?:\.\d{2})?)\s*$/m,
    /(\d{1,}(?:,\d{3})*(?:\.\d{2})?)/,
  ]
  for (const p of patterns) {
    const m = normalized.match(p)
    if (m) {
      const num = parseFloat((m[1] || m[0]).replace(/[^\d.]/g, ''))
      if (Number.isFinite(num) && num > 0 && num < 1e8) return Math.round(num * 100) / 100
    }
  }
  const anyNum = normalized.match(/(\d{2,}(?:\.\d{2})?)|(\d{1,}(?:,\d{3})*(?:\.\d{2})?)/)
  if (anyNum) {
    const n = parseFloat((anyNum[1] || anyNum[2] || anyNum[0]).replace(/,/g, ''))
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

function categorizeExpense(text) {
  if (!text || typeof text !== 'string') return 'other'
  const lower = text.toLowerCase()
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return cat
  }
  return 'other'
}

function getIndicator(percent, category) {
  const range = RECOMMENDED_RANGES[category]
  if (!range || range.max >= 100) return 'green'
  if (percent <= range.max && percent >= range.min) return 'green'
  if (percent <= range.max + 10) return 'orange'
  return 'red'
}

function generateAdvice(data) {
  const advice = []
  const { totalThisMonth, categoryBreakdown, lastMonthTotal, currentBillAmount, monthlyAvg } = data
  if (!totalThisMonth || !categoryBreakdown) return advice

  for (const [cat, info] of Object.entries(categoryBreakdown)) {
    if (!info || info.amount <= 0) continue
    const percent = totalThisMonth > 0 ? (info.amount / totalThisMonth) * 100 : 0
    const range = RECOMMENDED_RANGES[cat]
    if (range && range.max < 100) {
      if (percent > range.max) {
        advice.push(`You are spending a lot on ${CATEGORY_LABELS[cat].toLowerCase()} this month.`)
        advice.push('You may try reducing the quantity slightly.')
      } else if (percent >= range.min && percent <= range.max) {
        advice.push(`${CATEGORY_LABELS[cat]} cost is normal.`)
      }
    }
  }

  if (lastMonthTotal != null && totalThisMonth > lastMonthTotal && lastMonthTotal > 0) {
    const pct = Math.round(((totalThisMonth - lastMonthTotal) / lastMonthTotal) * 100)
    advice.push(`Your spending is ${pct}% more than last month.`)
    advice.push('Check where you can save a little.')
  }

  if (currentBillAmount != null && monthlyAvg != null && monthlyAvg > 0 && currentBillAmount > 0.4 * monthlyAvg) {
    advice.push('This bill is quite high compared to your usual bills.')
    advice.push('See if the amount on the bill is correct.')
  }

  if (advice.length === 0) {
    advice.push('Your expenses look fine this month.')
  }
  return advice
}

export default function ExpenseScanner() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [landAcres, setLandAcres] = useState('')
  const [userId] = useState(() => {
    try {
      return localStorage.getItem('expense_scanner_user_id') || ''
    } catch {
      return ''
    }
  })

  const handleFile = useCallback((e) => {
    const f = e.target.files?.[0]
    setFile(f)
    setError(null)
    setResult(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
  }, [preview])

  const processBill = async () => {
    if (!file) {
      setError('Please select a bill image.')
      return
    }
    if (!isSupabaseConfigured()) {
      setError('Supabase is not set up. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    let currentBillAmount = null
    try {
      const Tesseract = await import('tesseract.js')
      const { data } = await Tesseract.recognize(file, 'eng', { logger: () => {} })
      const rawText = data?.text || ''
      currentBillAmount = extractAmount(rawText)
      if (currentBillAmount == null || currentBillAmount <= 0) {
        setError('Could not find total amount on the bill. Please enter it manually or use a clearer photo.')
        setLoading(false)
        return
      }
      const category = categorizeExpense(rawText)
      const uid = userId?.trim() || null
      const { error: insertErr } = await supabase.from('expenses').insert({
        user_id: uid,
        amount: currentBillAmount,
        category,
        raw_text: rawText.slice(0, 5000),
      })
      if (insertErr) {
        setError(insertErr.message || 'Failed to save expense.')
        setLoading(false)
        return
      }

      const now = new Date()
      const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

      let query = supabase
        .from('expenses')
        .select('id, amount, category, created_at')
        .gte('created_at', startThisMonth.toISOString())
        .lte('created_at', endThisMonth.toISOString())
      if (uid) query = query.eq('user_id', uid)
      const { data: thisMonthRows, error: e1 } = await query.order('created_at', { ascending: false })
      if (e1) {
        setError(e1.message || 'Failed to load expenses.')
        setLoading(false)
        return
      }

      query = supabase
        .from('expenses')
        .select('amount')
        .gte('created_at', startLastMonth.toISOString())
        .lte('created_at', endLastMonth.toISOString())
      if (uid) query = query.eq('user_id', uid)
      const { data: lastMonthRows, error: e2 } = await query
      const lastMonthTotal = e2 ? null : (lastMonthRows || []).reduce((s, r) => s + Number(r.amount || 0), 0)

      const totalThisMonth = (thisMonthRows || []).reduce((s, r) => s + Number(r.amount || 0), 0)
      const categoryBreakdown = {}
      CATEGORIES.forEach((c) => {
        categoryBreakdown[c] = { amount: 0, count: 0, percent: 0, indicator: 'green' }
      })
      ;(thisMonthRows || []).forEach((r) => {
        const c = r.category || 'other'
        if (!categoryBreakdown[c]) categoryBreakdown[c] = { amount: 0, count: 0, percent: 0, indicator: 'green' }
        categoryBreakdown[c].amount += Number(r.amount || 0)
        categoryBreakdown[c].count += 1
      })
      Object.keys(categoryBreakdown).forEach((c) => {
        const info = categoryBreakdown[c]
        info.percent = totalThisMonth > 0 ? Math.round((info.amount / totalThisMonth) * 100) : 0
        info.indicator = getIndicator(info.percent, c)
      })

      const count = (thisMonthRows || []).length
      const monthlyAvg = count > 0 ? totalThisMonth / count : null
      const landNum = landAcres ? parseFloat(landAcres) : null
      const costPerAcre = landNum != null && landNum > 0 && totalThisMonth > 0
        ? Math.round((totalThisMonth / landNum) * 100) / 100
        : null

      const advice = generateAdvice({
        totalThisMonth,
        categoryBreakdown,
        lastMonthTotal,
        currentBillAmount,
        monthlyAvg,
      })

      setResult({
        totalThisMonth,
        categoryBreakdown,
        costPerAcre,
        advice,
      })
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again.')
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
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8 2 5 5.5 5 9.5c0 4 3 8.5 7 12.5 4-4 7-8.5 7-12.5C19 5.5 16 2 12 2zm0 11c-1.4 0-2.5-1.1-2.5-2.5S10.6 8 12 8s2.5 1.1 2.5 2.5S13.4 13 12 13z"/></svg>
            </span>
            <span className="site-nav-logo-text">कृषिSparsh</span>
          </a>
          <nav className="site-nav-links" aria-label="Main">
            <a href="/#disease">Disease Detection</a>
            <a href="/water-advisor/">Water Advisor</a>
            <a href="/expenses/" className="active">Expenses</a>
            <a href="/#schemes">Schemes</a>
          </nav>
          <div className="site-nav-right">
            <button type="button" className="site-nav-join" aria-label="Language">हिंदी</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '80px' }}>
        <section style={{ ...sectionStyle, textAlign: 'center', padding: '2rem 1rem' }}>
          <h1 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', color: '#1a3d16', margin: '0 0 0.5rem' }}>
            Expense Scanner
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: '#2d5a27' }}>
            Upload a bill photo. We will read the total and show your monthly summary.
          </p>
        </section>

        <section style={sectionStyle}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Bill image</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1rem' }}
          />
          {preview && (
            <div style={{ marginBottom: '1rem' }}>
              <img src={preview} alt="Bill preview" style={{ maxWidth: '100%', maxHeight: '200px', border: '2px solid #2d5a27', borderRadius: '8px' }} />
            </div>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Land size (acres) – optional</label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 2"
              value={landAcres}
              onChange={(e) => setLandAcres(e.target.value)}
              style={{ padding: '10px 12px', border: '4px solid #2d5a27', borderRadius: '8px', maxWidth: '140px', fontSize: '1rem' }}
            />
            <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: '#2d5a27' }}>For cost per acre</span>
          </div>
          <button
            type="button"
            onClick={processBill}
            disabled={loading}
            style={{ ...buttonBase, background: '#99E194', color: '#1a3d16', width: '100%', maxWidth: '320px' }}
          >
            {loading ? 'Reading bill…' : 'Scan and add expense'}
          </button>
          {error && <p style={{ color: '#b45309', marginTop: '0.75rem', fontWeight: '500' }} role="alert">{error}</p>}
        </section>

        {result && (
          <section style={sectionStyle}>
            <h2 style={{ fontSize: '0.875rem', marginTop: 0, fontWeight: 'bold' }}>This month</h2>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem', color: '#1a3d16' }}>
              Total: ₹ {Number(result.totalThisMonth).toLocaleString('en-IN')}
            </p>
            {result.costPerAcre != null && (
              <p style={{ margin: '0 0 1rem', color: '#2d5a27' }}>Cost per acre: ₹ {result.costPerAcre.toLocaleString('en-IN')}</p>
            )}

            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>By category</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem' }}>
              {CATEGORIES.map((cat) => {
                const info = result.categoryBreakdown?.[cat]
                if (!info || info.amount <= 0) return null
                const color = info.indicator === 'red' ? '#c53030' : info.indicator === 'orange' ? '#c05621' : '#2d5a27'
                return (
                  <li key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, flexShrink: 0 }} aria-hidden="true" />
                    <span style={{ flex: 1 }}>{CATEGORY_LABELS[cat]}: ₹ {Number(info.amount).toLocaleString('en-IN')} ({info.percent}%)</span>
                  </li>
                )
              })}
            </ul>

            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Advice</p>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: 1.6, color: '#1a3d16' }}>
              {result.advice.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  )
}
