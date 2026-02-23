# Deploy Smart Water Advisor to Vercel (whole project)

The repo builds **both** the main Krishisparsh site and the Water Advisor app. The nav “Water Advisor” links to `/water-advisor/`; `/#water` redirects there too.

---

## 1. Push to GitHub

```bash
cd /path/to/krishisparsh

git add .
git commit -m "Krishisparsh + Water Advisor combined build"
git push origin main
```

---

## 2. Vercel (one project, no Root Directory)

1. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project** → import the **krishisparsh** repo.
2. **Root Directory**: leave **empty** (use repo root).
3. **Build & Output** (from root `vercel.json`):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install` (at repo root; the build script installs water-advisor deps).
4. **Environment variables** (required for Water Advisor):
   - `VITE_SUPABASE_URL` = `https://YOUR_PROJECT_REF.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key  
   (Supabase Dashboard → Settings → API.)
5. **Deploy**.

---

## 3. URLs after deploy

- Main site: `https://your-project.vercel.app/`
- Water Advisor: `https://your-project.vercel.app/water-advisor/`
- `https://your-project.vercel.app/#water` redirects to the Water Advisor URL above.

---

## Checklist

- [ ] Edge Function deployed on Supabase (`getWeather`), `OPENWEATHER_API_KEY` set
- [ ] Repo pushed to GitHub
- [ ] Vercel project from repo root, **no** Root Directory
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set in Vercel
- [ ] Deploy succeeded; click “Water Advisor” in the nav or open `/#water`

---

## Troubleshooting

**“Failed to send to edge function”**

- **Supabase not configured:** If you see “Supabase is not configured…”, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel (Project → Settings → Environment Variables), then redeploy.
- **Wrong URL or key:** Use the exact values from Supabase Dashboard → Settings → API (Project URL and anon public key). No trailing slash on the URL.
- **Function not deployed:** In Supabase Dashboard → Edge Functions, ensure `getWeather` is deployed. Set secret `OPENWEATHER_API_KEY` (Settings → Edge Functions → Secrets or via CLI).
- **OpenWeather error:** If the function runs but returns an error, the message may mention OpenWeather — add or fix `OPENWEATHER_API_KEY` in Supabase Edge Function secrets.

**“Apply” does nothing / coordinates not used**

- Enter latitude/longitude (or use “Use My Current Location”), then click **Apply**. You should see “✓ Applied” and the message “Coordinates applied. You can now click Get irrigation advice.” Then click **Get irrigation advice**.
- If nothing appears, check the browser console (F12 → Console) for JavaScript errors.
