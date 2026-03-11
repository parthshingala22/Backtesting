# from Common.load_cash_data import generate_bullish_bearish_signal
# from Common.load_option_data import load_option_data

# # def match_atm_options(option_df, cash_df, symbol_col_name):

# #     option_df = option_df.merge(
# #         cash_df[["date", "time", "ATM"]],
# #         on=["date", "time"],
# #         how="left"
# #     )

# #     cash_df[symbol_col_name] = (
# #         option_df["prefix"]
# #         + cash_df["ATM"].astype(str)
# #         + option_df["option_type"]
# #     )

# #     option_df.drop(columns=["prefix", "option_type", "ATM"], inplace=True)

# #     new_df = option_df.merge(
# #         cash_df[["date", "time", symbol_col_name]],
# #         left_on=["date", "time", "symbol"],
# #         right_on=["date", "time", symbol_col_name],
# #         how="inner"
# #     )

# #     new_df.drop(columns=symbol_col_name, inplace=True)

# #     return new_df



# def match_atm_options(option_df, cash_df):

#     # Merge ATM directly
#     option_df = option_df.merge(
#         cash_df[["date", "time", "ATM"]],
#         on=["date", "time"],
#         how="left"
#     )

#     # Create ATM option symbol
#     option_df["atm_symbol"] = (
#         option_df["prefix"]
#         + option_df["ATM"].astype(str)
#         + option_df["option_type"]
#     )

#     # Filter only ATM options
#     new_df = option_df[option_df["symbol"] == option_df["atm_symbol"]]

#     # Drop unnecessary columns
#     new_df = new_df.drop(columns=["prefix", "option_type", "ATM", "atm_symbol"])

#     return new_df

# cash_path = "2025\\JAN\\01\\banknifty_cash.feather"
# call_path = "2025\\JAN\\01\\banknifty_call.feather"
# put_path = "2025\\JAN\\01\\banknifty_put.feather"

# cash_data = generate_bullish_bearish_signal(cash_path,"1min")
# call_data = load_option_data(call_path,"BANKNIFTY")
# put_data = load_option_data(put_path,"BANKNIFTY")

# new_data_call = match_atm_options(call_data, cash_data)
# new_data_put = match_atm_options(put_data, cash_data)

# new_data_call.to_csv("call.csv")
# new_data_put.to_csv("put.csv")

# print(new_data_call.head())

import pandas as pd

# data = pd.read_feather("data\\2022\\JAN\\03\\banknifty_cash.feather")
# data = pd.read_feather

# print(data.head())

from Common.load_cash_data import load_cash_data
from Common.indicators import rsi,bullish_n_bearish
from Common.candle_diff_pct import candle_diff_pct
from Common.time import hhmm_to_seconds
from Common.load_option_data import load_option_data
from bull_bear import match_atm_options

data = "data\\2022\\JAN\\12\\banknifty_cash.feather"
call_path = "data\\2022\\JAN\\12\\banknifty_call.feather"
put_path = "data\\2022\\JAN\\12\\banknifty_put.feather"

cash_data = load_cash_data(data,"5min")
cash_data = rsi(cash_data)
cash_data = bullish_n_bearish(cash_data)
cash_data = candle_diff_pct(cash_data)


call_data = load_option_data(call_path, "BANKNIFTY")
put_data  = load_option_data(put_path, "BANKNIFTY")

new_data_call = match_atm_options(call_data, cash_data, "new_symbol_call")
new_data_put = match_atm_options(put_data, cash_data, "new_symbol_put")

# print(cash_data.head())

# indicators = ["bullish_n_bearish_engulfing", "rsi"]
# indicators = ["bullish_n_bearish_engulfing"]
# indicators = ["rsi"]
indicators = []

# def entry_time_and_signal_symbol(cash_data, indicators, entry_time):

#     cash_data["previous_close"] = cash_data["close"].shift(1)

#     for _, row in cash_data.iterrows():

#         if "bullish_n_bearish_engulfing" in indicators and "rsi" in indicators:

#             if row["pattern"] == "Bullish Engulfing" and pd.notna(row["rsi"]) and row["rsi"] >= 70:
#                 return row["time"]

#             elif row["pattern"] == "Bearish Engulfing" and pd.notna(row["rsi"]) and row["rsi"] <= 30:
#                 return row["time"]

#         elif "bullish_n_bearish_engulfing" in indicators:

#             if row["pattern"] == "Bullish Engulfing":
#                 return row["time"]

#             elif row["pattern"] == "Bearish Engulfing":
#                 return row["time"]

#         elif "rsi" in indicators:

#             if pd.notna(row["rsi"]) and row["rsi"] >= 70:
#                 return row["time"]

#             elif pd.notna(row["rsi"]) and row["rsi"] <= 30:
#                 return row["time"]
        
#         elif not indicators:
#             return entry_time

#     return None


def entry_time_and_signal_symbol(cash_data, indicators, input_entry_time):

    for _, row in cash_data.iterrows():

        if not indicators:
            row = cash_data[cash_data["time"] == input_entry_time].iloc[0]
            return row["time"]

        pattern = row["pattern"]
        rsi = row["rsi"]

        if "bullish_n_bearish_engulfing" in indicators and "rsi" in indicators:

            if pd.notna(rsi):

                if pattern == "Bullish Engulfing" and rsi >= 70:
                    return row["time"]

                elif pattern == "Bearish Engulfing" and rsi <= 30:
                    return row["time"]

        elif "bullish_n_bearish_engulfing" in indicators:

            if pattern in ["Bullish Engulfing", "Bearish Engulfing"]:
                return row["time"]

        elif "rsi" in indicators:

            if pd.notna(rsi) and (rsi >= 70 or rsi <= 30):
                return row["time"]
    return None

entry_time = hhmm_to_seconds("09:30")

# print(entry_time_and_signal_symbol(cash_data, indicators, entry_time))
entry = entry_time_and_signal_symbol(cash_data, indicators, entry_time)
print(entry)


# def symbol(cash_data, entry,indicators):

#     row = cash_data[cash_data["time"] == entry].iloc[0]
#     symbol = None

#     if "bullish_n_bearish_engulfing" in indicators and "rsi" in indicators:

#         if row["pattern"] == "Bullish Engulfing" and row["rsi"] >= 70:
#             symbol = row["new_symbol_call"]

#         elif row["pattern"] == "Bearish Engulfing" and row["rsi"] <= 30:
#             symbol = row["new_symbol_put"]

#     elif "bullish_n_bearish_engulfing" in indicators:

#         if row["pattern"] == "Bullish Engulfing":
#             symbol = row["new_symbol_call"]
#         elif row["pattern"] == "Bearish Engulfing":
#             symbol = row["new_symbol_put"]

#     elif "rsi" in indicators:

#         if row["rsi"] >= 70:
#             symbol = row["new_symbol_call"]
#         elif row["rsi"] <= 30:
#             symbol = row["new_symbol_put"]

#     elif not indicators:
#         symbol = row["new_symbol_call"]
    
#     return symbol

# symbol = symbol(cash_data, entry, indicators)
# print(symbol)

cash_data.to_csv("cash_data_12.csv")
