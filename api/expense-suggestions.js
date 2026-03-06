const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function cors(res, req) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  const { currentItems, historicalSummary, totalThisMonth, lastMonthTotal, landAcres } = body;

  const prompt = `You are a farm expense advisor. Given the following data, give 3 to 5 short, actionable suggestions to optimize spending or improve record-keeping. Write in a friendly tone. Return a JSON object with a single key "suggestions" which is an array of strings. Example: {"suggestions": ["Suggestion 1", "Suggestion 2"]}

Current bill / items (user may have edited):
${JSON.stringify(currentItems || {}, null, 2)}

${historicalSummary ? `Historical summary:\n${historicalSummary}` : ''}
${totalThisMonth != null ? `Total this month (₹): ${totalThisMonth}` : ''}
${lastMonthTotal != null ? `Last month total (₹): ${lastMonthTotal}` : ''}
${landAcres != null && landAcres !== '' ? `Land (acres): ${landAcres}` : ''}`;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: 'Gemini request failed', details: err });
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: 'No content from Gemini' });
    const parsed = JSON.parse(text);
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [String(parsed)];
    return res.status(200).json({ suggestions });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
