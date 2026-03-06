import { useState, useCallback, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const API_BASE = import.meta.env.VITE_API_URL || ''

const CATEGORIES = ['fertilizer', 'seed', 'labour', 'pesticide', 'transport', 'other']
const CATEGORY_LABELS = {
  fertilizer: 'Fertilizer',
  seed: 'Seeds',
  labour: 'Labour',
  pesticide: 'Pesticide',
  transport: 'Transport',
  other: 'Other',
}
const LANG_KEY = 'krishisparsh_lang'
const T = {
  en: {
    fertilizer: 'Fertilizer',
    seed: 'Seeds',
    labour: 'Labour',
    pesticide: 'Pesticide',
    transport: 'Transport',
    other: 'Other',
    navDisease: 'Disease Detection',
    navWater: 'Water Advisor',
    navExpenses: 'Expenses',
    navSchemes: 'Schemes',
    langBtn: 'हिंदी',
    title: 'Expense Scanner',
    subtitle: 'Upload a bill photo. We will read the total and show your monthly summary.',
    billImage: 'Bill image',
    landSize: 'Land size (acres) – optional',
    landSizeHint: 'For cost per acre',
    scanBtn: 'Scan and add expense',
    scanning: 'Reading bill…',
    thisMonth: 'This month',
    total: 'Total',
    costPerAcre: 'Cost per acre',
    byCategory: 'By category',
    advice: 'Advice',
    selectBill: 'Please select a bill image.',
    noTotal: 'Could not find total amount on the bill. Please enter it manually or use a clearer photo.',
    supabaseError: 'Supabase is not set up. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    saveError: 'Failed to save expense.',
    loadError: 'Failed to load expenses.',
    genericError: 'Something went wrong. Try again.',
    getSuggestions: 'Get suggestions',
    fetchingSuggestions: 'Getting suggestions…',
    suggestions: 'Suggestions',
    scanUnavailable: 'Scan service unavailable. If you\'re testing locally, set VITE_API_URL to your deployed site URL (e.g. https://yoursite.vercel.app) and restart the dev server.',
    pastBills: 'Past bills',
    noPastBills: 'No past bills yet. Scan a bill to save it here.',
    deleteBill: 'Delete',
    close: 'Close',
    billTotal: 'Total',
  },
  hi: {
    fertilizer: 'उर्वरक',
    seed: 'बीज',
    labour: 'मजदूरी',
    pesticide: 'कीटनाशक',
    transport: 'परिवहन',
    other: 'अन्य',
    navDisease: 'रोग पहचान',
    navWater: 'जल सलाहकार',
    navExpenses: 'खर्च',
    navSchemes: 'योजनाएं',
    langBtn: 'English',
    title: 'खर्च स्कैनर',
    subtitle: 'बिल की फोटो अपलोड करें। हम कुल राशि पढ़कर महीने का सार दिखाएंगे।',
    billImage: 'बिल की तस्वीर',
    landSize: 'जमीन का आकार (एकड़) – वैकल्पिक',
    landSizeHint: 'प्रति एकड़ लागत के लिए',
    scanBtn: 'स्कैन करें और खर्च जोड़ें',
    scanning: 'बिल पढ़ रहे हैं…',
    thisMonth: 'इस महीने',
    total: 'कुल',
    costPerAcre: 'प्रति एकड़ लागत',
    byCategory: 'श्रेणी के अनुसार',
    advice: 'सलाह',
    selectBill: 'कृपया बिल की तस्वीर चुनें।',
    noTotal: 'बिल पर कुल राशि नहीं मिली। कृपया खुद डालें या साफ फोटो लें।',
    supabaseError: 'Supabase सेट अप नहीं है।',
    saveError: 'खर्च सहेजने में विफल।',
    loadError: 'खर्च लोड करने में विफल।',
    genericError: 'कुछ गड़बड़ हुई। दोबारा कोशिश करें।',
    getSuggestions: 'सुझाव लें',
    fetchingSuggestions: 'सुझाव लिए जा रहे हैं…',
    suggestions: 'सुझाव',
    scanUnavailable: 'स्कैन सेवा उपलब्ध नहीं। लोकल टेस्ट के लिए VITE_API_URL सेट करें।',
    pastBills: 'पिछले बिल',
    noPastBills: 'अभी कोई बिल नहीं। बिल स्कैन करने पर यहाँ दिखेगा।',
    deleteBill: 'हटाएं',
    close: 'बंद करें',
    billTotal: 'कुल',
  },
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

function getStoredLang() {
  try {
    return localStorage.getItem(LANG_KEY) || 'en'
  } catch {
    return 'en'
  }
}

function withIds(categories) {
  const out = {}
  let id = 0
  for (const cat of CATEGORIES) {
    const list = Array.isArray(categories?.[cat]) ? categories[cat] : []
    out[cat] = list.map((item) => ({
      id: ++id,
      name: item.name ?? '',
      quantity: item.quantity ?? '',
      unit: item.unit ?? '',
      amount: item.amount ?? '',
    }))
  }
  return out
}

const MAX_IMAGE_DIM = 1024
const JPEG_QUALITY = 0.65

function compressImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let w = img.width
      let h = img.height
      if (w > MAX_IMAGE_DIM || h > MAX_IMAGE_DIM) {
        if (w > h) {
          h = Math.round((h * MAX_IMAGE_DIM) / w)
          w = MAX_IMAGE_DIM
        } else {
          w = Math.round((w * MAX_IMAGE_DIM) / h)
          h = MAX_IMAGE_DIM
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'))
            return
          }
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result
            const base64 = dataUrl.indexOf('base64,') >= 0 ? dataUrl.split('base64,')[1] : dataUrl
            resolve({ imageBase64: base64, mimeType: 'image/jpeg' })
          }
          reader.onerror = reject
          reader.readAsDataURL(blob)
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }
    img.src = url
  })
}

export default function ExpenseScanner() {
  const [locale, setLocale] = useState(getStoredLang)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [geminiResult, setGeminiResult] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [openCategory, setOpenCategory] = useState(null)
  const [landAcres, setLandAcres] = useState('')
  const [pastBills, setPastBills] = useState([])
  const [expandedBillId, setExpandedBillId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [userId] = useState(() => {
    try {
      return localStorage.getItem('expense_scanner_user_id') || ''
    } catch {
      return ''
    }
  })
  const t = T[locale] || T.en
  const toggleLang = () => {
    const next = locale === 'en' ? 'hi' : 'en'
    try { localStorage.setItem(LANG_KEY, next) } catch (_) {}
    setLocale(next)
  }

  const loadPastBills = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    const uid = userId?.trim() || null
    let q = supabase.from('bill_scans').select('id, payload, created_at').order('created_at', { ascending: false })
    if (uid) q = q.eq('user_id', uid)
    const { data } = await q
    setPastBills(data || [])
  }, [userId])

  useEffect(() => {
    loadPastBills()
  }, [loadPastBills])

  const handleFile = useCallback((e) => {
    const f = e.target.files?.[0]
    setFile(f)
    setError(null)
    setResult(null)
    setGeminiResult(null)
    setSuggestions(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
  }, [preview])

  const updateGeminiItem = useCallback((cat, index, field, value) => {
    setGeminiResult((prev) => {
      if (!prev?.categories) return prev
      const next = { ...prev, categories: { ...prev.categories } }
      const list = [...(next.categories[cat] || [])]
      if (list[index]) list[index] = { ...list[index], [field]: value }
      next.categories[cat] = list
      return next
    })
  }, [])

  const fetchSuggestions = useCallback(async () => {
    if (!geminiResult?.categories) return
    setLoadingSuggestions(true)
    setSuggestions(null)
    try {
      let totalThisMonth = null
      let lastMonthTotal = null
      let historicalSummary = ''
      if (isSupabaseConfigured()) {
        const now = new Date()
        const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        const uid = userId?.trim() || null
        let q = supabase.from('expenses').select('amount').gte('created_at', startThisMonth.toISOString()).lte('created_at', endThisMonth.toISOString())
        if (uid) q = q.eq('user_id', uid)
        const { data: thisRows } = await q
        totalThisMonth = (thisRows || []).reduce((s, r) => s + Number(r.amount || 0), 0)
        q = supabase.from('expenses').select('amount').gte('created_at', startLastMonth.toISOString()).lte('created_at', endLastMonth.toISOString())
        if (uid) q = q.eq('user_id', uid)
        const { data: lastRows } = await q
        lastMonthTotal = (lastRows || []).reduce((s, r) => s + Number(r.amount || 0), 0)
        historicalSummary = `This month total: ₹${totalThisMonth}. Last month total: ₹${lastMonthTotal}.`
      }
      const body = {
        currentItems: { categories: geminiResult.categories, total: geminiResult.total },
        historicalSummary,
        totalThisMonth,
        lastMonthTotal,
        landAcres: landAcres.trim() || null,
      }
      const res = await fetch(`${API_BASE}/api/expense-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get suggestions')
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])
    } catch (err) {
      setError(err?.message || t.genericError)
    } finally {
      setLoadingSuggestions(false)
    }
  }, [geminiResult, landAcres, userId, t.genericError])

  const deleteBill = useCallback(async (id) => {
    if (!id || !isSupabaseConfigured()) return
    setDeletingId(id)
    await supabase.from('bill_scans').delete().eq('id', id)
    setPastBills((prev) => prev.filter((b) => b.id !== id))
    setExpandedBillId((current) => (current === id ? null : current))
    setDeletingId(null)
  }, [])

  const processBill = async () => {
    if (!file) {
      setError(t.selectBill)
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    setGeminiResult(null)
    setSuggestions(null)
    try {
      const { imageBase64, mimeType } = await compressImageToBase64(file)
      let scanRes
      try {
        scanRes = await fetch(`${API_BASE}/api/scan-bill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, mimeType }),
        })
      } catch (fetchErr) {
        setError(t.scanUnavailable)
        setLoading(false)
        return
      }
      let scanData
      try {
        scanData = await scanRes.json()
      } catch {
        setError(t.genericError)
        setLoading(false)
        return
      }
      if (scanRes.ok && scanData.categories) {
        setGeminiResult({
          categories: withIds(scanData.categories),
          total: scanData.total,
        })
        if (isSupabaseConfigured()) {
          const uid = userId?.trim() || null
          const { error: insertErr } = await supabase.from('bill_scans').insert({
            user_id: uid,
            payload: { categories: scanData.categories, total: scanData.total },
          })
          if (!insertErr) loadPastBills()
        }
        setLoading(false)
        return
      }
      setError(scanData?.error || t.genericError)
      setLoading(false)
      return
    } catch (err) {
      setError(err?.message || t.genericError)
      setLoading(false)
      return
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
            <a href="/#disease">{t.navDisease}</a>
            <a href="/water-advisor/">{t.navWater}</a>
            <a href="/expenses/" className="active">{t.navExpenses}</a>
            <a href="/#schemes">{t.navSchemes}</a>
          </nav>
          <div className="site-nav-right">
            <button type="button" className="site-nav-join" aria-label="Language" onClick={toggleLang}>{t.langBtn}</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '80px' }}>
        <section style={{ ...sectionStyle, textAlign: 'center', padding: '2rem 1rem' }}>
          <h1 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', color: '#1a3d16', margin: '0 0 0.5rem' }}>
            {t.title}
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: '#2d5a27' }}>
            {t.subtitle}
          </p>
        </section>

        <section style={sectionStyle}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t.billImage}</label>
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
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>{t.landSize}</label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 2"
              value={landAcres}
              onChange={(e) => setLandAcres(e.target.value)}
              style={{ padding: '10px 12px', border: '4px solid #2d5a27', borderRadius: '8px', maxWidth: '140px', fontSize: '1rem' }}
            />
            <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: '#2d5a27' }}>{t.landSizeHint}</span>
          </div>
          <button
            type="button"
            onClick={processBill}
            disabled={loading}
            style={{ ...buttonBase, background: '#99E194', color: '#1a3d16', width: '100%', maxWidth: '320px' }}
          >
            {loading ? t.scanning : t.scanBtn}
          </button>
          {error && <p style={{ color: '#b45309', marginTop: '0.75rem', fontWeight: '500' }} role="alert">{error}</p>}
        </section>

        {geminiResult && (
          <section style={sectionStyle}>
            <h2 style={{ fontSize: '1rem', marginTop: 0, fontWeight: 'bold', marginBottom: '0.5rem' }}>{t.byCategory}</h2>
            {geminiResult.total != null && (
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 1rem', color: '#1a3d16' }}>
                {t.total}: ₹ {Number(geminiResult.total).toLocaleString('en-IN')}
              </p>
            )}
            {CATEGORIES.map((cat) => {
              const items = geminiResult.categories?.[cat] || []
              if (items.length === 0) return null
              const label = t[cat] || CATEGORY_LABELS[cat]
              const isOpen = openCategory === cat
              return (
                <div key={cat} style={{ marginBottom: '0.75rem', border: '2px solid #2d5a27', borderRadius: '8px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setOpenCategory(isOpen ? null : cat)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      textAlign: 'left',
                      background: '#e8f5e9',
                      border: 'none',
                      fontWeight: 'bold',
                      color: '#1a3d16',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{label}</span>
                    <span style={{ fontSize: '1.25rem' }}>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.7)' }}>
                      {items.map((item, idx) => (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <input
                            value={item.name}
                            onChange={(e) => updateGeminiItem(cat, idx, 'name', e.target.value)}
                            placeholder="Item"
                            style={{ padding: '6px 8px', border: '2px solid #2d5a27', borderRadius: '6px', fontSize: '0.9rem' }}
                          />
                          <input
                            value={item.quantity}
                            onChange={(e) => updateGeminiItem(cat, idx, 'quantity', e.target.value)}
                            placeholder="Qty"
                            style={{ width: '60px', padding: '6px 8px', border: '2px solid #2d5a27', borderRadius: '6px', fontSize: '0.9rem' }}
                          />
                          <input
                            value={item.unit}
                            onChange={(e) => updateGeminiItem(cat, idx, 'unit', e.target.value)}
                            placeholder="Unit"
                            style={{ width: '56px', padding: '6px 8px', border: '2px solid #2d5a27', borderRadius: '6px', fontSize: '0.9rem' }}
                          />
                          <input
                            value={item.amount}
                            onChange={(e) => updateGeminiItem(cat, idx, 'amount', e.target.value)}
                            placeholder="₹"
                            style={{ width: '72px', padding: '6px 8px', border: '2px solid #2d5a27', borderRadius: '6px', fontSize: '0.9rem' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <button
              type="button"
              onClick={fetchSuggestions}
              disabled={loadingSuggestions}
              style={{ ...buttonBase, background: '#2d5a27', color: '#fff', marginTop: '1rem', width: '100%', maxWidth: '280px' }}
            >
              {loadingSuggestions ? t.fetchingSuggestions : t.getSuggestions}
            </button>
            {suggestions && suggestions.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{t.suggestions}</p>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: 1.6, color: '#1a3d16' }}>
                  {suggestions.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {result && (
          <section style={sectionStyle}>
            <h2 style={{ fontSize: '0.875rem', marginTop: 0, fontWeight: 'bold' }}>{t.thisMonth}</h2>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem', color: '#1a3d16' }}>
              {t.total}: ₹ {Number(result.totalThisMonth).toLocaleString('en-IN')}
            </p>
            {result.costPerAcre != null && (
              <p style={{ margin: '0 0 1rem', color: '#2d5a27' }}>{t.costPerAcre}: ₹ {result.costPerAcre.toLocaleString('en-IN')}</p>
            )}

            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{t.byCategory}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem' }}>
              {CATEGORIES.map((cat) => {
                const info = result.categoryBreakdown?.[cat]
                if (!info || info.amount <= 0) return null
                const color = info.indicator === 'red' ? '#c53030' : info.indicator === 'orange' ? '#c05621' : '#2d5a27'
                const label = t[cat] || CATEGORY_LABELS[cat]
                return (
                  <li key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, flexShrink: 0 }} aria-hidden="true" />
                    <span style={{ flex: 1 }}>{label}: ₹ {Number(info.amount).toLocaleString('en-IN')} ({info.percent}%)</span>
                  </li>
                )
              })}
            </ul>

            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{t.advice}</p>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: 1.6, color: '#1a3d16' }}>
              {result.advice.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        )}

        {isSupabaseConfigured() && (
          <section style={sectionStyle}>
            <h2 style={{ fontSize: '1rem', marginTop: 0, fontWeight: 'bold', marginBottom: '0.75rem' }}>{t.pastBills}</h2>
            {pastBills.length === 0 ? (
              <p style={{ color: '#2d5a27', margin: 0, fontSize: '0.95rem' }}>{t.noPastBills}</p>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                {pastBills.map((bill) => {
                  const payload = bill.payload || {}
                  const total = payload.total != null ? Number(payload.total) : null
                  const dateStr = bill.created_at ? new Date(bill.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''
                  const catCount = payload.categories ? Object.values(payload.categories).filter(Array.isArray).reduce((s, arr) => s + (arr?.length || 0), 0) : 0
                  return (
                    <button
                      key={bill.id}
                      type="button"
                      onClick={() => setExpandedBillId(bill.id)}
                      style={{
                        flex: '0 0 auto',
                        width: '140px',
                        minHeight: '100px',
                        scrollSnapAlign: 'start',
                        padding: '0.75rem',
                        border: '3px solid #2d5a27',
                        borderRadius: '8px',
                        background: '#e8f5e9',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: '#1a3d16',
                        boxShadow: '3px 3px 0 rgba(45, 90, 39, 0.25)',
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.25rem' }}>{dateStr}</div>
                      {total != null && <div style={{ fontSize: '1.1rem' }}>₹ {total.toLocaleString('en-IN')}</div>}
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.85 }}>{catCount} items</div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {expandedBillId && (() => {
          const bill = pastBills.find((b) => b.id === expandedBillId)
          if (!bill) return null
          const payload = bill.payload || {}
          const categories = payload.categories || {}
          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Bill details"
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
              }}
              onClick={() => setExpandedBillId(null)}
            >
              <div
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  border: '4px solid #2d5a27',
                  maxWidth: '90vw',
                  maxHeight: '85vh',
                  overflow: 'auto',
                  padding: '1.25rem',
                  boxShadow: '6px 6px 0 rgba(45, 90, 39, 0.3)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '1rem' }}>
                    {bill.created_at ? new Date(bill.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                  </strong>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => deleteBill(bill.id)}
                      disabled={deletingId === bill.id}
                      style={{ ...buttonBase, background: '#c53030', color: '#fff', padding: '8px 14px', fontSize: '0.9rem' }}
                    >
                      {deletingId === bill.id ? '…' : t.deleteBill}
                    </button>
                    <button type="button" onClick={() => setExpandedBillId(null)} style={{ ...buttonBase, background: '#2d5a27', color: '#fff', padding: '8px 14px', fontSize: '0.9rem' }}>
                      {t.close}
                    </button>
                  </div>
                </div>
                {payload.total != null && (
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 1rem', color: '#1a3d16' }}>
                    {t.billTotal}: ₹ {Number(payload.total).toLocaleString('en-IN')}
                  </p>
                )}
                {CATEGORIES.map((cat) => {
                  const items = categories[cat]
                  if (!Array.isArray(items) || items.length === 0) return null
                  const label = t[cat] || CATEGORY_LABELS[cat]
                  return (
                    <div key={cat} style={{ marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.35rem', color: '#2d5a27' }}>{label}</div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.5 }}>
                        {items.map((item, i) => (
                          <li key={i}>
                            {item.name ?? '—'}
                            {item.quantity != null && item.quantity !== '' && ` × ${item.quantity}`}
                            {item.unit && ` ${item.unit}`}
                            {item.amount != null && item.amount !== '' && ` → ₹ ${Number(item.amount).toLocaleString('en-IN')}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </main>
    </>
  )
}
