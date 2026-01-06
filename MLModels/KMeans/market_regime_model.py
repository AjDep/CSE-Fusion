import joblib
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from feature_engineering import add_obi

FEATURES = ['diff_percent', 'ppl_dominance', 'obi']
N_CLUSTERS = 4
RANDOM_STATE = 42

def train_model(df: pd.DataFrame):
    df = add_obi(df)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df[FEATURES])

    kmeans = KMeans(
        n_clusters=N_CLUSTERS,
        random_state=RANDOM_STATE,
        n_init=10
    )
    kmeans.fit(X_scaled)

    return kmeans, scaler


def save_model(kmeans, scaler, path="models"):
    import os
    os.makedirs(path, exist_ok=True)
    joblib.dump(kmeans, f"{path}/kmeans.pkl")
    joblib.dump(scaler, f"{path}/scaler.pkl")


def load_model(path="models"):
    kmeans = joblib.load(f"{path}/kmeans.pkl")
    scaler = joblib.load(f"{path}/scaler.pkl")
    return kmeans, scaler
