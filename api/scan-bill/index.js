const GEMINI_MODEL = 'gemini-3-flash-preview';
const GEMINI_GENERATE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const IMAGE_PROMPT = 'You are an expert at reading retail/farm bills. Look at the bill image and extract every line item. Classify each item into exactly one category: fertilizer, seed, labour, pesticide, transport, other. Return a valid JSON object only, no markdown, with keys: categories (object with fertilizer, seed, labour, pesticide, transport, other as arrays of {name, quantity, unit, amount}), and total (number or null). Use empty arrays for empty categories.';

const TEXT_PROMPT = `You are an expert at reading retail/farm bills. Below is raw text from a bill (OCR output). Extract every line item from this text. Classify each item into exactly one category: fertilizer, seed, labour, pesticide, transport, other. Return a valid JSON object only, no markdown or extra text, with this shape: { "categories": { "fertilizer": [], "seed": [], "labour": [], "pesticide": [], "transport": [], "other": [] }, "total": number or null }. Each category array has items like {"name": "...", "quantity": number or string, "unit": "kg/litre/etc", "amount": number}. Use empty arrays for no items. amount in rupees. If total is in the text, set "total" to that number.

Bill text:
`;

function cors(res, req) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function callGemini(key, body, retries = 2) {
  const url = `${GEMINI_GENERATE_URL}?key=${encodeURIComponent(key)}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.status === 429 && attempt < retries) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    return response;
  }
  return null;
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
  const { text: billText, imageBase64, mimeType = 'image/jpeg' } = body;

  let parts;
  if (billText && typeof billText === 'string' && billText.trim().length > 0) {
    parts = [{ text: TEXT_PROMPT + billText.trim() }];
  } else if (imageBase64) {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    parts = [
      { inline_data: { mime_type: mimeType, data: base64Data } },
      { text: IMAGE_PROMPT },
    ];
  } else {
    return res.status(400).json({ error: 'Either "text" or "imageBase64" required' });
  }

  const requestBody = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  try {
    const response = await callGemini(key, requestBody);
    if (!response) return res.status(429).json({ error: 'Rate limit exceeded. Please try again in a minute.' });
    if (!response.ok) {
      const err = await response.text();
      const msg = response.status === 429 ? 'Rate limit exceeded (429). Wait a minute and try again.' : 'Gemini request failed';
      return res.status(response.status).json({ error: msg, details: err });
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
