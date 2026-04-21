import pandas as pd
from market_regime_model import load_model, add_obi, FEATURES, prepare_feature_frame
from cluster_labels import CLUSTER_INFO


def _get_model_features(scaler):
    feature_names = getattr(scaler, "feature_names_in_", None)
    if feature_names is not None:
        return list(feature_names)
    return FEATURES


def predict_today(df_snapshot: pd.DataFrame):
    kmeans, scaler = load_model()

    df = add_obi(df_snapshot)
    df = prepare_feature_frame(df)

    model_features = _get_model_features(scaler)
    for column in model_features:
        if column not in df.columns:
            df[column] = 0

    X_scaled = scaler.transform(df[model_features])
    df["cluster"] = kmeans.predict(X_scaled)

    df["regime"] = df["cluster"].map(lambda c: CLUSTER_INFO[c]["name"])
    df["action"] = df["cluster"].map(lambda c: CLUSTER_INFO[c]["action"])

    return df
