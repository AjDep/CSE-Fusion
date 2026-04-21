import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from feature_engineering import add_obi

FEATURES = [
    'diff_percent',
    'ppl_dominance',
    'obi',
    'total_bid',
    'total_ask',
    'top_bid_qty',
    'tot_turnover',
    'tot_volume'
]


def prepare_feature_frame(df: pd.DataFrame) -> pd.DataFrame:
    prepared = df.copy()

    for col in FEATURES:
        if col not in prepared.columns:
            prepared[col] = 0

        prepared[col] = pd.to_numeric(prepared[col], errors='coerce')
        prepared[col] = prepared[col].replace([np.inf, -np.inf], np.nan)

        median_value = prepared[col].median(skipna=True)
        fill_value = median_value if pd.notna(median_value) else 0
        prepared[col] = prepared[col].fillna(fill_value)

    return prepared


def prepare_training_data(df: pd.DataFrame):
    df = df.sort_values(['security', 'recorded_at']).copy()
    df = add_obi(df)
    df = prepare_feature_frame(df)

    df['next_price'] = df.groupby('security')['current_bid_price'].shift(-1)
    df['target_is_up'] = (df['next_price'] > df['current_bid_price']).astype(int)

    df = df.dropna(subset=['next_price'])

    X = df[FEATURES]
    y = df['target_is_up']

    return X, y, df


def train_model(X_train, y_train):
    # Compute class weights to handle imbalance (67% SELL vs 33% BUY)
    classes = np.unique(y_train)
    class_weights = np.array([len(y_train) / (len(classes) * np.sum(y_train == c)) for c in classes])
    sample_weights = class_weights[y_train.astype(int)]

    model = GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=3,
        subsample=0.8,
        validation_fraction=0.1,
        random_state=42
    )
    model.fit(X_train, y_train, sample_weight=sample_weights)
    return model


def save_model(model, path="models"):
    import os
    os.makedirs(path, exist_ok=True)
    joblib.dump(model, f"{path}/gb_price_direction.pkl")


def load_model(path="models"):
    return joblib.load(f"{path}/gb_price_direction.pkl")
