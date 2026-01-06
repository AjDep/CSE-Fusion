import joblib
import pandas as pd
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
    'top_bid_qty'
]


def prepare_training_data(df: pd.DataFrame):
    df = df.sort_values(['security', 'recorded_at']).copy()
    df = add_obi(df)

    df['next_price'] = df.groupby('security')['current_bid_price'].shift(-1)
    df['target_is_up'] = (df['next_price'] > df['current_bid_price']).astype(int)

    df = df.dropna(subset=['next_price'])

    X = df[FEATURES]
    y = df['target_is_up']

    return X, y, df


def train_model(X_train, y_train):
    model = GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=3,
        random_state=42
    )
    model.fit(X_train, y_train)
    return model


def save_model(model, path="models"):
    import os
    os.makedirs(path, exist_ok=True)
    joblib.dump(model, f"{path}/gb_price_direction.pkl")


def load_model(path="models"):
    return joblib.load(f"{path}/gb_price_direction.pkl")
