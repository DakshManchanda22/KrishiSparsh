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
from PIL import Image
from torchvision import transforms

from model import CNN_NeuralNet
from classes import CLASSES

# Same as training: 256x256 then ToTensor
INFERENCE_TRANSFORM = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor(),
])

MODEL_PATH = Path(__file__).resolve().parent / "FinalModel.pth"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

app = FastAPI(title="Plant Disease Prediction API")

_model = None


def get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model file not found: {MODEL_PATH}. "
                "Extract FinalModel.pth from FinalModel.zip or FinalModel.rar."
            )
        model = CNN_NeuralNet(in_channels=3, num_diseases=len(CLASSES))
        state = torch.load(MODEL_PATH, map_location=DEVICE)
        if isinstance(state, dict) and "state_dict" in state:
            model.load_state_dict(state["state_dict"], strict=True)
        else:
            model.load_state_dict(state, strict=True)
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
