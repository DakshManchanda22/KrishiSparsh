"""
Inference script for plant disease prediction.
Uses same preprocessing as training: 256x256 resize, ToTensor (no normalization).
"""

import torch
from PIL import Image
from torchvision import transforms

from model import CNN_NeuralNet
from classes import CLASSES

# Checkpoint may have been saved from a notebook (__main__.CNN_NeuralNet)
import __main__
__main__.CNN_NeuralNet = CNN_NeuralNet

# Match training: ImageFolder with ToTensor(); dataset images were 256x256
INFERENCE_TRANSFORM = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor(),
])

MODEL_PATH = "FinalModel.pth"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def load_model(path: str = MODEL_PATH):
    """Load trained model. Supports full model pickle or state_dict only."""
    loaded = torch.load(path, map_location=DEVICE, weights_only=False)
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
