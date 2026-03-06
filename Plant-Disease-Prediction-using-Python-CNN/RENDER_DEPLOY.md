# Deploy Plant Disease API on Render

## 1. Prepare the model file

- Extract **`FinalModel.pth`** from `FinalModel.zip` or `FinalModel.rar`.
- Put `FinalModel.pth` in this directory (`Plant-Disease-Prediction-using-Python-CNN/`) and **commit and push** it to your GitHub repo.  
  (If the file is too large for GitHub, use [Render Disk](https://render.com/docs/disks) or upload it to a cloud bucket and download it in the build step.)

## 2. Create a Web Service on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in.
2. **New → Web Service**.
3. Connect your **GitHub** repo (the one that contains this folder).
4. Configure:
   - **Name:** `plant-disease-api` (or any name).
   - **Root Directory:** `Plant-Disease-Prediction-using-Python-CNN`  
     (so Render runs build/start from this folder).
   - **Runtime:** Python 3.
   - **Build Command:**  
     `pip install -r requirements-render.txt`
   - **Start Command:**  
     `uvicorn api:app --host 0.0.0.0 --port $PORT`
5. **Instance type:** Free tier may be tight for loading the model; if deploys or requests fail, switch to a **paid instance** (e.g. 512 MB or 1 GB RAM).
6. Click **Create Web Service**.

Render will build and deploy. The first request may be slow while the model loads.

## 3. Use the API

Your service URL will be like:  
`https://plant-disease-api-xxxx.onrender.com`

Test:

```bash
curl -X POST "https://plant-disease-api-xxxx.onrender.com/predict" -F "file=@leaf.jpg"
```

Expected response:

```json
{"disease": "Tomato_Late_Blight", "confidence": 0.94}
```

## 4. Optional: Blueprint (render.yaml)

If you use **Blueprint** (Infrastructure as Code):

- Keep **Root Directory** set to `Plant-Disease-Prediction-using-Python-CNN` when linking the repo, or put `render.yaml` at repo root and set `rootDir` for this service so the build runs in that folder.
- Render will read `render.yaml` from the repo and create/update the service from it.

## 5. Large model / build issues

- **Out of memory during build or at runtime:** Use a paid instance with more RAM.
- **FinalModel.pth over GitHub limit:** Add it to Git LFS, or don’t commit it: store the file in a cloud bucket and add a build step that downloads it (e.g. `curl` or `wget`) into this directory before the start command runs.
