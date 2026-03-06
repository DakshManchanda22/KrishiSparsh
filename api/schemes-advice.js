/**
 * Vercel Serverless Function: Scheme suggestions via Gemini.
 * Set GEMINI_API_KEY in Vercel project Environment Variables.
 */

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

function buildPrompt(answers) {
  const lines = Object.entries(answers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  return `Based on these farmer details suggest Indian government schemes that may help them. Explain each scheme in very simple language.

Farmer details:
${lines}`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY not set. Add it in Vercel Project Settings → Environment Variables.',
    })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const answers = body.answers || {}
  const prompt = buildPrompt(answers)

  try {
    const response = await fetch(
      `${GEMINI_URL}?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      return res.status(response.status).json({
        error: 'Gemini API error',
        detail: errText.slice(0, 500),
      })
    }

    const data = await response.json()
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No response from the model.'
    return res.status(200).json({ text })
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to get scheme suggestions',
      detail: err.message,
    })
  }
}
