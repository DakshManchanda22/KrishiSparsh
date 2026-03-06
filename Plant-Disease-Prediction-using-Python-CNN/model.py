"""
PyTorch CNN model for plant disease classification.
Architecture matches the training notebook (GoogleColabResult.ipynb).
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


def ConvBlock(in_channels: int, out_channels: int, pool: bool = False) -> nn.Sequential:
    """Convolution block with BatchNorm and ReLU. Optional 4x4 MaxPool."""
    layers = [
        nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
        nn.BatchNorm2d(out_channels),
        nn.ReLU(inplace=True),
    ]
    if pool:
        layers.append(nn.MaxPool2d(4))
    return nn.Sequential(*layers)


class CNN_NeuralNet(nn.Module):
    """
    CNN used for plant disease classification in the notebook.
    Input: 3-channel image (e.g. 256x256). Output: logits for num_diseases classes.
    """

    def __init__(self, in_channels: int = 3, num_diseases: int = 38):
        super().__init__()
        self.conv1 = ConvBlock(in_channels, 64)
        self.conv2 = ConvBlock(64, 128, pool=True)
        self.res1 = nn.Sequential(ConvBlock(128, 128), ConvBlock(128, 128))
        self.conv3 = ConvBlock(128, 256, pool=True)
        self.conv4 = ConvBlock(256, 512, pool=True)
        self.res2 = nn.Sequential(ConvBlock(512, 512), ConvBlock(512, 512))
        self.classifier = nn.Sequential(
            nn.MaxPool2d(4),
            nn.Flatten(),
            nn.Linear(512, num_diseases),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = self.conv1(x)
        out = self.conv2(out)
        out = self.res1(out) + out
        out = self.conv3(out)
        out = self.conv4(out)
        out = self.res2(out) + out
        out = self.classifier(out)
        return out
