import pandas as pd
from Common.time import seconds_to_hhmm

def match_atm_options(option_df, cash_df):

    cash_df["ATM"] = ((cash_df["close"] / 100).round() * 100).astype(int)

    option_df = option_df.merge(
        cash_df[["date", "time", "ATM"]],
        on=["date", "time"],
        how="left"
    )

    option_df = option_df[option_df["strike"] == option_df["ATM"]]

    return option_df

def match_itm_options(option_df, cash_df, strike_type):
    if strike_type == "ITM1":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) - 50).astype(int)
    elif strike_type == "ITM2":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) - 100).astype(int)
    elif strike_type == "ITM3":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) - 150).astype(int)
    elif strike_type == "ITM4":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) - 200).astype(int)
    elif strike_type == "ITM5":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) - 250).astype(int)
    elif strike_type == "ITM6":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) - 300).astype(int)
    elif strike_type == "ITM7":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) - 350).astype(int)
    elif strike_type == "ITM8":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) - 400).astype(int)
    elif strike_type == "ITM9":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) - 450).astype(int)
    elif strike_type == "ITM10":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) - 500).astype(int)
    
    option_df = option_df.merge(
        cash_df[["date", "time", strike_type]],
        on=["date", "time"],
        how="left"
    )

    option_df = option_df[option_df["strike"] == option_df[strike_type]]

    return option_df

def match_otm_options(option_df, cash_df, strike_type):
    if strike_type == "OTM1":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) + 50).astype(int)
    elif strike_type == "OTM2":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) + 100).astype(int)
    elif strike_type == "OTM3":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) + 150).astype(int)
    elif strike_type == "OTM4":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) + 200).astype(int)
    elif strike_type == "OTM5":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) + 250).astype(int)
    elif strike_type == "OTM6":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) + 300).astype(int)
    elif strike_type == "OTM7":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) + 350).astype(int)
    elif strike_type == "OTM8":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) + 400).astype(int)
    elif strike_type == "OTM9":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) + 450).astype(int)
    elif strike_type == "OTM10":
        cash_df[strike_type] = (((cash_df["close"] / 100).round() * 100) + 500).astype(int)
    
    option_df = option_df.merge(
        cash_df[["date", "time", strike_type]],
        on=["date", "time"],
        how="left"
    )

    option_df = option_df[option_df["strike"] == option_df[strike_type]]

    return option_df


def match_premium_options(option_df, cash_df,target_premium):

    merged_df = option_df.merge(
        cash_df[["date", "time"]],
        on=["date", "time"],
        how="inner"
    )

    merged_df["premium_diff"] = (merged_df["open"] - target_premium).abs()

    idx = merged_df.groupby(["date", "time"])["premium_diff"].idxmin()

    result_df = merged_df.loc[idx].copy()

    result_df.drop(columns=["premium_diff"], inplace=True)

    return result_df


def entry_time_and_signal_symbol(cash_data, indicators, input_entry_start_time, input_entry_end_time):

    window = cash_data[
        (cash_data["time"] >= input_entry_start_time) &
        (cash_data["time"] <= input_entry_end_time)
    ]


    for _, row in window.iterrows():

        if not indicators:
            return row["time"]

        pattern = row["pattern"]
        rsi_val = row["rsi"]

        if "bullish_n_bearish_engulfing" in indicators and "rsi" in indicators:
            if pd.notna(rsi_val):
                if pattern == "Bullish Engulfing" and rsi_val >= 70:
                    return row["time"]
                elif pattern == "Bearish Engulfing" and rsi_val <= 30:
                    return row["time"]

        elif "bullish_n_bearish_engulfing" in indicators:
            if pattern in ["Bullish Engulfing", "Bearish Engulfing"]:
                return row["time"]

        elif "rsi" in indicators:
            if pd.notna(rsi_val) and (rsi_val >= 70 or rsi_val <= 30):
                return row["time"]

    return None


def symbol(cash_data, entry,indicators):

    row = cash_data[cash_data["time"] == entry].iloc[0]
    symbol = None

    if "bullish_n_bearish_engulfing" in indicators and "rsi" in indicators:

        if row["pattern"] == "Bullish Engulfing" and row["rsi"] >= 70:
            symbol = "CE"

        elif row["pattern"] == "Bearish Engulfing" and row["rsi"] <= 30:
            symbol = "PE"

    elif "bullish_n_bearish_engulfing" in indicators:

        if row["pattern"] == "Bullish Engulfing":
            symbol = "CE"
        elif row["pattern"] == "Bearish Engulfing":
            symbol = "PE"

    elif "rsi" in indicators:

        if row["rsi"] >= 70:
            symbol = "CE"
        elif row["rsi"] <= 30:
            symbol = "PE"

    elif not indicators:
        symbol = "CE"
    
    return symbol


def buy_call_and_put(cash_data, new_data_put, new_data_call, entry_time, symbol_result, stop_loss, target):

    if "CE" == symbol_result:
        option_df = new_data_call
    else:
        option_df = new_data_put
    

    entry_row = option_df[option_df["time"] == entry_time]

    if entry_row.empty:
        return cash_data, None, None, None

    buy_price = entry_row["open"].iloc[0]

    stop_loss_price = round(buy_price * (1 - (stop_loss / 100)), 2)
    target_price = round(buy_price * (1 + (target / 100)), 2)

    mask = cash_data["time"] == entry_time

    cash_data.loc[mask, "symbol"] = entry_row["symbol"].iloc[0]
    cash_data.loc[mask, "signal_buy/sell"] = "Buy"
    cash_data.loc[mask, "buy_price"] = buy_price
    cash_data.loc[mask, "stop_loss"] = stop_loss_price
    cash_data.loc[mask, "target"] = target_price

    return cash_data


# def sell_trade(cash_data,new_data_put,new_data_call,symbol,entry_time,exit_time):
    
#     row = cash_data[cash_data["time"] == entry_time].iloc[0]
#     sell_price = None
#     exit_reason = None

#     if "CE" == symbol:
#         option_df = new_data_call.copy()
#     else:
#         option_df = new_data_put.copy()


#     option_df = option_df[option_df["time"] >= entry_time]

#     for i in range(len(option_df)):

#         time = option_df.iloc[i]["time"]
#         low = option_df.iloc[i]["low"]
#         high = option_df.iloc[i]["high"]

#         if low <= row["stop_loss"]:
#             exit_time = time
#             sell_price = row["stop_loss"]
#             exit_reason = "Stoploss Hit"
#             break

#         if high >= row["target"]:
#             exit_time = time
#             sell_price = row["target"]
#             exit_reason = "Target Hit"
#             break

#         if time >= exit_time:
#             exit_time = time
#             sell_price = option_df.iloc[i]["close"]
#             exit_reason = f"Time Exit {seconds_to_hhmm(exit_time)}"
#             break

#     cash_data.loc[
#         (cash_data["time"] == entry_time),
#         "sell_price"
#     ] = sell_price
    
#     cash_data.loc[
#         (cash_data["time"] == entry_time),
#         "entry_time"
#     ] = seconds_to_hhmm(entry_time)

#     cash_data.loc[
#         (cash_data["time"] == entry_time),
#         "exit_time"
#     ] = seconds_to_hhmm(exit_time)

#     cash_data.loc[
#         (cash_data["time"] == entry_time),
#         "exit_reason"
#     ] = exit_reason
  
#     return cash_data

def sell_trade(cash_data,new_data_put,new_data_call,symbol,entry_time,exit_time,buy_price,trailing_stop_loss,move_pct):
    
    row = cash_data[cash_data["time"] == entry_time].iloc[0]
    sell_price = None
    exit_reason = None

    if "CE" == symbol:
        option_df = new_data_call.copy()
    else:
        option_df = new_data_put.copy()


    option_df = option_df[option_df["time"] >= entry_time]

    for i in range(len(option_df)):

        time = option_df.iloc[i]["time"]
        low = option_df.iloc[i]["low"]
        high = option_df.iloc[i]["high"]
        
        if trailing_stop_loss is not None and move_pct is not None:
            step = buy_price * (trailing_stop_loss / 100)

            if high >= buy_price + step:

                point = buy_price * (move_pct / 100)

                row["stop_loss"] = round(row["stop_loss"] + point, 2)
                row["target"] = round(row["target"] + point, 2)

                buy_price = buy_price + point  
        
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



def profit_loss(cash_data,entry_time,quantity,index_upper):

    row = cash_data[cash_data["time"] == entry_time].iloc[0]
    result = row["sell_price"] - row["buy_price"]

    if index_upper == "NIFTY":
        result = result * 75
    if index_upper == "BANKNIFTY":
        result = result * 30


    pnl = round((result * quantity),2)

    cash_data.loc[
        (cash_data["time"] == entry_time),
        "profit_n_loss"
    ] = pnl

    return cash_data



