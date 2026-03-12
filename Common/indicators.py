import pandas as pd

def rsi(data):
    delta = data["close"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(14).mean()
    avg_loss = loss.rolling(14).mean()

    rs = avg_gain / avg_loss
    data["rsi"] = round(100 - (100 / (1 + rs)), 2)

    return data

def bullish_n_bearish(data):
    data["candle_color"] = "Green"
    data.loc[data["close"] < data["open"], "candle_color"] = "Red"

    data["next_candle_color"] = data["candle_color"].shift(-1)
    data["next_candle_close"] = data["close"].shift(-1)
    data["next_candle_open"] = data["open"].shift(-1)

    data["pattern"] = None

    # bullish = (
    #     (data["candle_color"] == "Red") &
    #     (data["next_candle_color"] == "Green") &
    #     (data["close"] >= data["next_candle_open"]) &
    #     (data["open"] <= data["next_candle_close"])
    # )

    # bearish = (
    #     (data["candle_color"] == "Green") &
    #     (data["next_candle_color"] == "Red") &
    #     (data["close"] <= data["next_candle_open"]) &
    #     (data["open"] >= data["next_candle_close"])
    # )

    bullish = (
        (data["candle_color"] == "Red") &
        (data["next_candle_color"] == "Green") &
        (data["close"] >= data["next_candle_open"]) &
        (data["open"] < data["next_candle_close"])
    )

    bearish = (
        (data["candle_color"] == "Green") &
        (data["next_candle_color"] == "Red") &
        (data["close"] <= data["next_candle_open"]) &
        (data["open"] > data["next_candle_close"])
    )

    data.loc[bullish.shift(2, fill_value=False), "pattern"] = "Bullish Engulfing"
    data.loc[bearish.shift(2, fill_value=False), "pattern"] = "Bearish Engulfing"

    data = data.dropna(subset=["close"])

    return data





# data = pd.read_feather("..\\2025\\JAN\\01\\banknifty_cash.feather")
# rsi(data)
# print(data.head(20))
