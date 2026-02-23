# Deploy Smart Water Advisor to Vercel

You’ve already deployed the Edge Function on Supabase. Follow these steps to push to GitHub and deploy the frontend on Vercel.

---

## 1. Push to GitHub

**Option A – Push only the Water Advisor app (recommended for Vercel)**

Use a repo that contains only the `water-advisor` app so Vercel’s root is the app folder:

```bash
cd /Users/dakshmanchanda/Desktop/krishisparsh

# Create a new repo folder and copy only water-advisor
mkdir -p ../water-advisor-repo
cp -R water-advisor/* ../water-advisor-repo/
cp .gitignore ../water-advisor-repo/ 2>/dev/null || true
cd ../water-advisor-repo

git init
git add .
git commit -m "Smart Water Advisor – React + Vite + Supabase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Create the repo on GitHub first: [github.com/new](https://github.com/new) (e.g. name: `smart-water-advisor`). Use that URL for `origin`.

**Option B – Push the whole krishisparsh repo**

If you want everything (main site + water-advisor) in one repo:

```bash
cd /Users/dakshmanchanda/Desktop/krishisparsh

git init
git add .
git commit -m "Krishisparsh + Smart Water Advisor"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/krishisparsh.git
git push -u origin main
```

Then on Vercel you’ll set **Root Directory** to `water-advisor` (see step 3).

---

## 2. Connect the repo to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub).
2. Click **Add New…** → **Project**.
3. **Import** the GitHub repo you pushed (e.g. `smart-water-advisor` or `krishisparsh`).
4. **Root Directory**:
   - If the repo is **only** the Water Advisor app: leave **Root Directory** empty.
   - If the repo is **krishisparsh** (whole project): set **Root Directory** to `water-advisor`.
5. **Framework Preset**: Vercel usually detects **Vite**. If not, choose **Vite**.
6. **Build and Output** (should be auto-filled; confirm):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
7. **Environment variables** (do this before deploying):
   - Click **Environment Variables**.
   - Add:

     | Name | Value | Environment |
     |------|--------|-------------|
     | `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` | Production, Preview, Development |
     | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Production, Preview, Development |

   Get both from Supabase: **Project Settings** → **API** → Project URL and **anon** key.
8. Click **Deploy**.

Vercel will build and deploy. The Edge Function is already on Supabase, so the app will call it using the URL from `VITE_SUPABASE_URL`.

---

## 3. After deploy

- Your app will be at `https://your-project.vercel.app`.
- To use a custom domain: Vercel project → **Settings** → **Domains**.
- If you change env vars later, trigger a new deploy (e.g. **Redeploy** in the Deployments tab).

---

## Checklist

- [ ] Edge Function deployed on Supabase (`getWeather`)
- [ ] Supabase secret `OPENWEATHER_API_KEY` set
- [ ] Repo pushed to GitHub
- [ ] Vercel project created and repo connected
- [ ] Root Directory set to `water-advisor` (only if repo is whole krishisparsh)
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set in Vercel
- [ ] Deploy succeeded; test “Get irrigation advice” on the live URL
