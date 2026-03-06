"""
Inference script for plant disease prediction.
Uses same preprocessing as training: 256x256 resize, ToTensor (no normalization).
"""

import torch
from PIL import Image
from torchvision import transforms

from model import CNN_NeuralNet
from classes import CLASSES

# Match training: ImageFolder with ToTensor(); dataset images were 256x256
INFERENCE_TRANSFORM = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor(),
])

MODEL_PATH = "FinalModel.pth"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def load_model(path: str = MODEL_PATH):
    """Load trained model. Supports full checkpoint or state_dict only."""
    model = CNN_NeuralNet(in_channels=3, num_diseases=len(CLASSES))
    state = torch.load(path, map_location=DEVICE)
    if isinstance(state, dict) and "state_dict" in state:
        model.load_state_dict(state["state_dict"], strict=True)
    else:
        model.load_state_dict(state, strict=True)
    model.to(DEVICE)
    model.eval()
    return model


def predict_image(image_path: str, model=None):
    """
    Load image, preprocess, run inference.
    Returns (disease_class_name, confidence_probability).
    """
    if model is None:
        model = load_model()
    img = Image.open(image_path).convert("RGB")
    x = INFERENCE_TRANSFORM(img).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        logits = model(x)
    probs = torch.softmax(logits, dim=1)
    confidence, idx = probs[0].max(0)
    return CLASSES[idx.item()], confidence.item()


if __name__ == "__main__":
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else "leaf.jpg"
    disease, conf = predict_image(path)
    print("disease=%r, confidence=%.4f" % (disease, conf))
