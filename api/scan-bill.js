const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const PROMPT = `You are an expert at reading retail/farm bills. Look at the bill image and extract every line item.

Classify each item into exactly one category: fertilizer, seed, labour, pesticide, transport, other.

Return a valid JSON object only, no markdown or extra text, with this shape:
{
  "categories": {
    "fertilizer": [{"name": "item name", "quantity": number or string, "unit": "kg/litre/bag/etc", "amount": number}],
    "seed": [],
    "labour": [],
    "pesticide": [],
    "transport": [],
    "other": []
  },
  "total": number or null
}
Use empty arrays for categories with no items. quantity can be a number or string like "2". amount is in rupees. If total is visible on the bill, set "total" to that number.`;

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
  const { imageBase64, mimeType = 'image/jpeg' } = body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

  const parts = [
    {
      inline_data: {
        mime_type: mimeType,
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
      },
    },
    { text: PROMPT },
  ];

  try {
    const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.1,
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
    const categories = parsed.categories || {};
    const out = {
      categories: {
        fertilizer: Array.isArray(categories.fertilizer) ? categories.fertilizer : [],
        seed: Array.isArray(categories.seed) ? categories.seed : [],
        labour: Array.isArray(categories.labour) ? categories.labour : [],
        pesticide: Array.isArray(categories.pesticide) ? categories.pesticide : [],
        transport: Array.isArray(categories.transport) ? categories.transport : [],
        other: Array.isArray(categories.other) ? categories.other : [],
      },
      total: typeof parsed.total === 'number' ? parsed.total : null,
    };
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
