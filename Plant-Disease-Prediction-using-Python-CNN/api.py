"""
Plant Disease Prediction API (FastAPI).

Run locally:
  pip install -r requirements.txt
  uvicorn api:app --reload

Test:
  curl -X POST "http://localhost:8000/predict" -F "file=@leaf.jpg"
"""

import io
from pathlib import Path

import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from PIL import Image
from torchvision import transforms

from model import CNN_NeuralNet
from classes import CLASSES

# Checkpoint was saved from a notebook where the class lived in __main__.
# Make it findable so torch.load can unpickle the file.
import __main__
__main__.CNN_NeuralNet = CNN_NeuralNet

CORS_ORIGINS = [
    "https://krishi-sparsh.vercel.app",
    "https://www.krishi-sparsh.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]


def _cors_headers(origin) -> dict:
    allow_origin = origin if origin in CORS_ORIGINS else CORS_ORIGINS[0]
    return {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
    }


class AddCORSHeadersMiddleware(BaseHTTPMiddleware):
    """Add CORS headers to every response (including 500) so browser always receives them."""

    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return Response(
                status_code=200,
                headers=_cors_headers(request.headers.get("origin")),
            )
        response = await call_next(request)
        origin = request.headers.get("origin")
        for k, v in _cors_headers(origin).items():
            response.headers[k] = v
        return response

# Same as training: 256x256 then ToTensor
INFERENCE_TRANSFORM = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor(),
])

MODEL_PATH = Path(__file__).resolve().parent / "FinalModel.pth"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

app = FastAPI(title="Plant Disease Prediction API")

# Must be first: add CORS to every response including 5xx errors
app.add_middleware(AddCORSHeadersMiddleware)

_model = None


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Add CORS to HTTPException responses (400, 503, etc.)."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=_cors_headers(request.headers.get("origin")),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return 500 with CORS headers so the browser can read the error."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
        headers=_cors_headers(request.headers.get("origin")),
    )


def get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model file not found: {MODEL_PATH}. "
                "Extract FinalModel.pth from FinalModel.zip or FinalModel.rar."
            )
        loaded = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)
        if isinstance(loaded, torch.nn.Module):
            model = loaded
        else:
            model = CNN_NeuralNet(in_channels=3, num_diseases=len(CLASSES))
            if isinstance(loaded, dict) and "state_dict" in loaded:
                model.load_state_dict(loaded["state_dict"], strict=True)
            else:
                model.load_state_dict(loaded, strict=True)
        model.to(DEVICE)
        model.eval()
        _model = model
    return _model


@app.post("/predict")
def predict(file: UploadFile = File(...)):
    """Accept an image file; return predicted disease and confidence."""
    try:
        contents = file.file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    x = INFERENCE_TRANSFORM(img).unsqueeze(0).to(DEVICE)
    try:
        model = get_model()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    with torch.no_grad():
        logits = model(x)
    probs = torch.softmax(logits, dim=1)
    confidence, idx = probs[0].max(0)
    disease = CLASSES[idx.item()]

    return {"disease": disease, "confidence": round(confidence.item(), 4)}


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
