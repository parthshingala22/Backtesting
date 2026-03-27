import pandas as pd
from Common.time import seconds_to_hhmm


def match_atm_options(option_df, cash_df, symbol_col_name):

    cash_df["ATM"] = ((cash_df["close"] / 100).round() * 100).astype(int)

    option_df = option_df.merge(
        cash_df[["date", "time", "ATM"]],
        on=["date", "time"],
        how="left"
    )

    cash_df[symbol_col_name] = (
        option_df["prefix"]
        + cash_df["ATM"].astype(str)
        + option_df["option_type"]
    )

    option_df.drop(columns=["prefix", "option_type", "ATM"], inplace=True)

    new_df = option_df.merge(
        cash_df[["date", "time", symbol_col_name]],
        left_on=["date", "time", "symbol"],
        right_on=["date", "time", symbol_col_name],
        how="inner"
    )

    new_df.drop(columns=symbol_col_name, inplace=True)

    return new_df



def match_premium_options(option_df, cash_df, symbol_col_name, target_premium):

    merged_df = option_df.merge(
        cash_df[["date", "time"]],
        on=["date", "time"],
        how="inner"
    )

    merged_df["premium_diff"] = (merged_df["open"] - target_premium).abs()

    idx = merged_df.groupby(["date", "time"])["premium_diff"].idxmin()

    result_df = merged_df.loc[idx].copy()

    symbol_map = result_df.set_index(["date", "time"])["symbol"]

    cash_df[symbol_col_name] = cash_df.set_index(["date", "time"]).index.map(symbol_map)

    result_df.drop(columns=["premium_diff"], inplace=True)

    return result_df

    
def entry_time_and_signal_symbol(cash_data, indicators, input_entry_time):
    
    # cash_data = cash_data[(cash_data["time"] >= 33300) & (cash_data["time"] <= 35100)]

    for _, row in cash_data.iterrows():

        if not indicators:
            row = cash_data[cash_data["time"] == input_entry_time].iloc[0]
            return row["time"]

        pattern = row["pattern"]
        rsi = row["rsi"]

        if "bullish_n_bearish_engulfing" in indicators and "rsi" in indicators:
            if row["time"] >= input_entry_time:
                if pd.notna(rsi):

                    if pattern == "Bullish Engulfing" and rsi >= 70:
                        return row["time"]

                    elif pattern == "Bearish Engulfing" and rsi <= 30:
                        return row["time"]

        elif "bullish_n_bearish_engulfing" in indicators:
            if row["time"] >= input_entry_time:

                if pattern in ["Bullish Engulfing", "Bearish Engulfing"]:
                    return row["time"]

        elif "rsi" in indicators:
            if row["time"] >= input_entry_time:

                if pd.notna(rsi) and (rsi >= 70 or rsi <= 30):
                    return row["time"]
    return None


# def entry_time_and_signal_symbol(cash_data, indicators, entry_start_time, entry_end_time):
#     cash_data = cash_data[(cash_data["time"] >= entry_start_time) & (cash_data["time"] <= entry_end_time)]

#     for _, row in cash_data.iterrows():

#         if not indicators:
#             # row = cash_data[cash_data["time"] == entry_start_time].iloc[0]
#             return row["time"]

#         pattern = row["pattern"]
#         rsi = row["rsi"]

#         if "bullish_n_bearish_engulfing" in indicators and "rsi" in indicators:
#             # if (row["time"] >= entry_start_time) & (row["time"] <= entry_end_time):
#                 if pd.notna(rsi):

#                     if pattern == "Bullish Engulfing" and rsi >= 70:
#                         return row["time"]

#                     elif pattern == "Bearish Engulfing" and rsi <= 30:
#                         return row["time"]

#         elif "bullish_n_bearish_engulfing" in indicators:
#             # if (row["time"] >= entry_start_time) & (row["time"] <= entry_end_time):

#                 if pattern in ["Bullish Engulfing", "Bearish Engulfing"]:
#                     return row["time"]

#         elif "rsi" in indicators:
#             # if (row["time"] >= entry_start_time) & (row["time"] <= entry_end_time):

#                 if pd.notna(rsi) and (rsi >= 70 or rsi <= 30):
#                     return row["time"]
#     return None





def symbol(cash_data, entry,indicators):

    row = cash_data[cash_data["time"] == entry].iloc[0]
    symbol = None

    if "bullish_n_bearish_engulfing" in indicators and "rsi" in indicators:

        if row["pattern"] == "Bullish Engulfing" and row["rsi"] >= 70:
            symbol = row["new_symbol_call"]

        elif row["pattern"] == "Bearish Engulfing" and row["rsi"] <= 30:
            symbol = row["new_symbol_put"]

    elif "bullish_n_bearish_engulfing" in indicators:

        if row["pattern"] == "Bullish Engulfing":
            symbol = row["new_symbol_call"]
        elif row["pattern"] == "Bearish Engulfing":
            symbol = row["new_symbol_put"]

    elif "rsi" in indicators:

        if row["rsi"] >= 70:
            symbol = row["new_symbol_call"]
        elif row["rsi"] <= 30:
            symbol = row["new_symbol_put"]

    elif not indicators:
        symbol = row["new_symbol_call"]

    # if "bullish_n_bearish_engulfing" in indicators and "rsi" in indicators:

    #     if row["pattern"] == "Bullish Engulfing" and row["rsi"] >= 70:
    #         symbol = row["new_symbol_put"]

    #     elif row["pattern"] == "Bearish Engulfing" and row["rsi"] <= 30:
    #         symbol = row["new_symbol_call"]

    # elif "bullish_n_bearish_engulfing" in indicators:

    #     if row["pattern"] == "Bullish Engulfing":
    #         symbol = row["new_symbol_put"]
    #     elif row["pattern"] == "Bearish Engulfing":
    #         symbol = row["new_symbol_call"]

    # elif "rsi" in indicators:

    #     if row["rsi"] >= 70:
    #         symbol = row["new_symbol_put"]
    #     elif row["rsi"] <= 30:
    #         symbol = row["new_symbol_call"]

    # elif not indicators:
    #     symbol = row["new_symbol_call"]
    
    return symbol


def buy_call_and_put(cash_data, new_data_put, new_data_call, entry_time, symbol_result, stop_loss, target):

    if "CE" in symbol_result:
        option_df = new_data_call
    else:
        option_df = new_data_put
    

    entry_row = option_df[option_df["time"] == entry_time]

    if entry_row.empty:
        return cash_data, None, None, None
        # return cash_data

    buy_price = entry_row["open"].iloc[0]

    stop_loss_price = round(buy_price * (1 - (stop_loss / 100)), 2)
    target_price = round(buy_price * (1 + (target / 100)), 2)

    mask = cash_data["time"] == entry_time

    cash_data.loc[mask, "signal_buy/sell"] = "Buy"
    cash_data.loc[mask, "buy_price"] = buy_price
    cash_data.loc[mask, "stop_loss"] = stop_loss_price
    cash_data.loc[mask, "target"] = target_price

    return cash_data



def sell_trade(cash_data,new_data_put,new_data_call,symbol,entry_time,exit_time):
    
    row = cash_data[cash_data["time"] == entry_time].iloc[0]
    sell_price = None
    exit_reason = None

    if "CE" in symbol:
        option_df = new_data_call.copy()
    else:
        option_df = new_data_put.copy()


    option_df = option_df[option_df["time"] >= entry_time]

    for i in range(len(option_df)):

        time = option_df.iloc[i]["time"]
        low = option_df.iloc[i]["low"]
        high = option_df.iloc[i]["high"]

        if low <= row["stop_loss"]:
            exit_time = time
            sell_price = row["stop_loss"]
            exit_reason = "Stoploss Hit"
            break

        if high >= row["target"]:
            exit_time = time
            sell_price = row["target"]
            exit_reason = "Target Hit"
            break

        if time >= exit_time:
            exit_time = time
            sell_price = option_df.iloc[i]["close"]
            exit_reason = f"Time Exit {seconds_to_hhmm(exit_time)}"
            break

    cash_data.loc[
        (cash_data["time"] == entry_time),
        "sell_price"
    ] = sell_price
    
    cash_data.loc[
        (cash_data["time"] == entry_time),
        "entry_time"
    ] = seconds_to_hhmm(entry_time)

    cash_data.loc[
        (cash_data["time"] == entry_time),
        "exit_time"
    ] = seconds_to_hhmm(exit_time)

    cash_data.loc[
        (cash_data["time"] == entry_time),
        "exit_reason"
    ] = exit_reason
  
    return cash_data



def profit_loss(cash_data,entry_time,quantity):

    row = cash_data[cash_data["time"] == entry_time].iloc[0]
    result = row["sell_price"] - row["buy_price"]

    pnl = round((result * quantity),2)

    cash_data.loc[
        (cash_data["time"] == entry_time),
        "profit_n_loss"
    ] = pnl

    return cash_data




