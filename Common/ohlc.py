def OHLC_format(data):
    data["open"] = data["open"] / 100
    data["high"] = data["high"] / 100
    data["low"] = data["low"] / 100
    data["close"] = data["close"] / 100

    return data