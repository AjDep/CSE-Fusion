def final_trade_decision(row):
    """
    Combines all 3 model outputs into one decision
    """

    # ❌ Risk filter
    if row["market_regime"] in ["Panic Selling", "Extreme Volatility"]:
        return "NO TRADE"

    # 🚀 Strong buy
    if (
        row["gb_confidence"] > 0.65 and
        row["transformer_confidence"] > 0.60 and
        row["market_regime"] == "Whale Accumulation"
    ):
        return "STRONG BUY"

    # ⚠️ Weak / uncertain
    if row["gb_confidence"] < 0.45:
        return "WAIT"

    return "HOLD"
