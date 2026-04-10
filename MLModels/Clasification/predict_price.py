import pandas as pd
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from feature_engineering import add_obi
from price_direction_model import load_model, FEATURES
from config import CLASSIFIER_BUY_THRESHOLD, CLASSIFIER_SELL_THRESHOLD


def predict_next_move(df_snapshot: pd.DataFrame):
    model = load_model()
    df_snapshot = add_obi(df_snapshot)
    X = df_snapshot[FEATURES]

    probs = model.predict_proba(X)[:, 1]

    df = df_snapshot.copy()
    df['ai_confidence'] = probs

    df['signal'] = df['ai_confidence'].apply(
        lambda x: "🚀 BUY" if x > CLASSIFIER_BUY_THRESHOLD else
                  ("🔻 SELL / WAIT" if x < CLASSIFIER_SELL_THRESHOLD else "⚖️ HOLD")
    )

    return df
