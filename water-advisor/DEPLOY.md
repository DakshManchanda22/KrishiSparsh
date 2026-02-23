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
