import pandas as pd
from Common.ohlc import OHLC_format
# from ohlc import OHLC_format
# from Backtesting.Common.ohlc import OHLC_format


def replace_date(match):
    old_date = match.group(1)
    new_date = pd.to_datetime(old_date, format="%d%b%y").strftime("%d%m%y")
    return new_date

def load_option_data(path,index_name):
    df = pd.read_feather(path)

    df = OHLC_format(df)

    nearest_expiry = df["expiry"].min()

    df = df[df["expiry"] == nearest_expiry]
    df = df.sort_values(by="time")

    df["symbol"] = df["symbol"].str.replace(
        r'(\d{2}[A-Z]{3}\d{2})',
        replace_date,
        regex=True
    )

    return df




# path = "..\\..\\data\\2022\\JAN\\03\\nifty_call.feather"
# index_name = "NIFTY"

# data = load_option_data(path,index_name)
# # print(data.head())
# # print(data.shape)
# data.to_csv("call.csv")

