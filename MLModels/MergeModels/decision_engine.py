import pandas as pd

def fuse_signals(kmeans: pd.DataFrame,
                 classifier: pd.DataFrame,
                 transformer: pd.DataFrame) -> pd.DataFrame:

    # Merge all models on security
    df = kmeans.merge(classifier, on="security", how="left")
    df = df.merge(transformer, on="security", how="left")

    final_signals = []

    for _, row in df.iterrows():
        regime = row.get("regime")
        km_signal = row.get("signal_kmeans")
        clf_signal = row.get("signal_classifier")
        tr_signal = row.get("signal_transformer")

        # 🚨 Rule 1: Panic overrides everything
        if regime == "🛑 Panic Crash":
            final = "🔻 SELL"

        # 🐳 Rule 2: Whale + Momentum
        elif regime == "🐳 Whale Accumulation" and tr_signal == "BUY":
            final = "🟢 STRONG BUY"

        # ⚖️ Rule 3: Agreement
        elif clf_signal == "BUY" and tr_signal == "BUY":
            final = "🟢 BUY"

        # ⏸️ Rule 4: Default safe
        else:
            final = "⚖️ HOLD"

        final_signals.append(final)

    df["final_signal"] = final_signals
    return df
