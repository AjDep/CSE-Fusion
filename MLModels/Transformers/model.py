import torch
import torch.nn as nn

class MarketTransformer(nn.Module):
    def __init__(self, feature_count, d_model=64, nhead=4, num_layers=2):
        super().__init__()
        self.embedding = nn.Linear(feature_count, d_model)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(
            encoder_layer,
            num_layers=num_layers
        )
        self.fc = nn.Linear(d_model, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.embedding(x)
        x = self.transformer(x)
        x = x[:, -1, :]   # last timestep
        x = self.fc(x)
        return self.sigmoid(x)
