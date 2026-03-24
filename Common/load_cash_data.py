import pandas as pd
from Common.ohlc import OHLC_format
# from ohlc import OHLC_format
# from Backtesting.Common.ohlc import OHLC_format


def load_cash_data(path, interval):

    data = pd.read_feather(path)

    data["time"] = pd.to_datetime(data["time"], unit="s")
    data = data.set_index("time")

    agg_dict = {
        "open": "first",
        "high": "max",
        "low": "min",
        "close": "last",
        "date": "first",
        "symbol": "first"
    }

    if interval in ["3min", "5min", "15min"]:
        data = data.resample(interval).agg(agg_dict)

    data = data.reset_index()

    data["time"] = (
        data["time"].dt.hour * 3600 +
        data["time"].dt.minute * 60 +
        data["time"].dt.second
    )

    data = OHLC_format(data)

    return data







