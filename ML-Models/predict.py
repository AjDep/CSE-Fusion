import pandas as pd
from market_regime_model import load_model, add_obi, FEATURES
from cluster_labels import CLUSTER_INFO


def predict_today(df_snapshot: pd.DataFrame):
    kmeans, scaler = load_model()

    df = add_obi(df_snapshot)

    X_scaled = scaler.transform(df[FEATURES])
    df["cluster"] = kmeans.predict(X_scaled)

    df["regime"] = df["cluster"].map(lambda c: CLUSTER_INFO[c]["name"])
    df["action"] = df["cluster"].map(lambda c: CLUSTER_INFO[c]["action"])

    return df
