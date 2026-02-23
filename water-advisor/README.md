# Smart Water Advisor

React + Vite + Supabase Edge Functions + OpenWeather. Minecraft-style pastel UI; irrigation advice by crop, stage, and weather.

---

## 1. Where to paste the OpenWeather API key

**Option A – Supabase (recommended for production)**  
1. Supabase Dashboard → Project → **Edge Functions** → **Secrets** (or **Settings** → **Edge Function Secrets**).  
2. Add secret: name `OPENWEATHER_API_KEY`, value = your OpenWeather API key.  
3. Redeploy the `getWeather` function so it picks up the secret.

**Option B – In the Edge Function code (local/dev only)**  
- Open `supabase/functions/getWeather/index.ts`.  
- Replace `"PASTE_OPENWEATHER_KEY_HERE"` with your key (the line that has `?? "PASTE_OPENWEATHER_KEY_HERE"`).  
- Do **not** commit this key; use Option A for production.

Get a free key: [OpenWeather](https://openweathermap.org/api) → Sign up → API keys.

---

## 2. How to deploy the Supabase Edge Function

1. **Install Supabase CLI** (if needed):
   ```bash
   npm i -g supabase
   ```
2. **Log in and link project**:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (`YOUR_PROJECT_REF` is in Supabase Dashboard → Settings → General.)
3. **Set the OpenWeather secret** (see section 1):
   ```bash
   supabase secrets set OPENWEATHER_API_KEY=your_openweather_api_key
   ```
4. **Deploy the function**:
   ```bash
   supabase functions deploy getWeather
   ```
5. **CORS**: If your frontend is on another domain, allow it in Dashboard → Edge Functions → getWeather → Settings, or by setting `--allowed-origins` when deploying.

---

## 3. How to run locally

**Frontend**

```bash
cd water-advisor
npm install
cp .env.example .env
# Edit .env: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173`).

**Edge Function (optional, for local testing)**

```bash
supabase functions serve getWeather
# Set OPENWEATHER_API_KEY in Supabase Dashboard or in code for local run
```

Use your project’s Supabase URL so the frontend calls the **deployed** Edge Function, or point it at `http://localhost:54321/functions/v1/getWeather` if you use local Supabase.

---

## 4. How to test the feature

1. Open the app (local or deployed).  
2. Select **Crop** (e.g. Rice).  
3. Select **Crop stage** (e.g. “Just Planted”).  
4. Click **Use My Current Location** (allow browser location) or enter **Latitude** and **Longitude** and click **Apply**.  
5. Click **Get irrigation advice**.  
6. Check:
   - **Today’s water required** (L/acre).  
   - **Tomorrow’s recommendation** (L/acre).  
   - **Weather summary**.  
   - **Warning** (pastel orange) when rain probability &gt; 60%.

Use different crops, stages, and locations to verify. If the function isn’t deployed or the key is missing, you’ll see an error in the UI or network tab.

---

## 5. Environment variables to configure

**Frontend (Vite)**  
Create `.env` in `water-advisor/`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- From Supabase Dashboard: **Settings** → **API** → Project URL and anon/public key.

**Edge Function (Supabase)**  
- `OPENWEATHER_API_KEY` – your OpenWeather API key (set in Supabase secrets; see section 1 and 2).

No other env vars are required for the Smart Water Advisor module.

---

## Project structure

```
water-advisor/
├── src/
│   ├── lib/supabase.js      # Supabase client
│   ├── pages/WaterAdvisor.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/functions/getWeather/
│   └── index.ts
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

Production checklist: use Supabase secrets for `OPENWEATHER_API_KEY`, never commit the key, and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for your deployment (e.g. in your host’s env or CI).
