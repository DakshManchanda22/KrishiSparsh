const GEMINI_MODEL = 'gemini-3-flash-preview';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
  const { currentItems, historicalSummary, pastBillsSummary, totalThisMonth, lastMonthTotal, landAcres } = body;

  const prompt = `You are a farm expense advisor. Given the following data (current bill and historic data from the database), give 3 to 5 short, actionable suggestions to optimize spending or improve record-keeping. Use the historic data to compare trends (e.g. spending more on fertilizer than before). Write in a friendly tone. Return a JSON object with a single key "suggestions" which is an array of strings. Example: {"suggestions": ["Suggestion 1", "Suggestion 2"]}

Current bill / items (user may have edited):
${JSON.stringify(currentItems || {}, null, 2)}

${historicalSummary ? `Aggregate history:\n${historicalSummary}` : ''}
${pastBillsSummary ? `\n${pastBillsSummary}` : ''}
${totalThisMonth != null ? `\nTotal this month (₹): ${totalThisMonth}` : ''}
${lastMonthTotal != null ? `\nLast month total (₹): ${lastMonthTotal}` : ''}
${landAcres != null && landAcres !== '' ? `\nLand (acres): ${landAcres}` : ''}`;

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  };

  try {
    let response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    if (response.status === 429) {
      await new Promise((r) => setTimeout(r, 2000));
      response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
    }
    if (!response.ok) {
      const err = await response.text();
      const msg = response.status === 429 ? 'Rate limit exceeded. Wait a minute and try again.' : 'Gemini request failed';
      return res.status(response.status).json({ error: msg, details: err });
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
};
