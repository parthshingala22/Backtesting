def candle_diff_pct(data):
    data["next_candle_high"] = data["high"].shift(-1)
    data["next_candle_low"] = data["low"].shift(-1)

    for i in range(len(data) - 2):

        current_high = data.loc[i, "high"]
        current_low = data.loc[i, "low"]

        next_high = data.loc[i, "next_candle_high"]
        next_low = data.loc[i, "next_candle_low"]

        max_high = max(current_high,next_high)
        min_low = min(current_low,next_low)

        pct = round(((max_high-min_low) / min_low) *100, 3)

        data.loc[i+2, "candle_diff_pct"] = pct
    return data





