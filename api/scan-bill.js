const GEMINI_UPLOAD_URL = 'https://generativelanguage.googleapis.com/upload/v1beta/files';
const GEMINI_GENERATE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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

async function uploadFileToGemini(key, imageBuffer, mimeType) {
  const numBytes = imageBuffer.length;
  const displayName = 'bill-' + Date.now() + (mimeType === 'image/png' ? '.png' : '.jpg');
  const startRes = await fetch(`${GEMINI_UPLOAD_URL}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(numBytes),
      'X-Goog-Upload-Header-Content-Type': mimeType,
    },
    body: JSON.stringify({ file: { display_name: displayName } }),
  });
  if (!startRes.ok) {
    const t = await startRes.text();
    throw new Error('Upload start failed: ' + t);
  }
  const uploadUrl = startRes.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('No upload URL in response');
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(numBytes),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: imageBuffer,
  });
  if (!uploadRes.ok) {
    const t = await uploadRes.text();
    throw new Error('Upload finalize failed: ' + t);
  }
  const uploadJson = await uploadRes.json();
  const fileUri = uploadJson?.file?.uri;
  if (!fileUri) throw new Error('No file URI in upload response');
  return fileUri;
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
    const imageBuffer = Buffer.from(base64Data, 'base64');
    let fileUri;
    try {
      fileUri = await uploadFileToGemini(key, imageBuffer, mimeType);
    } catch (uploadErr) {
      return res.status(502).json({ error: 'File upload failed', details: uploadErr.message });
    }
    parts = [
      { file_data: { mime_type: mimeType, file_uri: fileUri } },
      { text: IMAGE_PROMPT },
    ];
  } else {
    return res.status(400).json({ error: 'Either "text" or "imageBase64" required' });
  }

  try {
    const response = await fetch(`${GEMINI_GENERATE_URL}?key=${encodeURIComponent(key)}`, {
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
