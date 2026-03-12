from flask import Flask,request,jsonify
from pathlib import Path
from Common.time import hhmm_to_seconds
from Common.load_option_data import load_option_data
from Common.load_cash_data import load_cash_data
from Common.indicators import rsi,bullish_n_bearish
from Common.candle_diff_pct import candle_diff_pct
from bull_bear import match_atm_options,entry_time_and_signal_symbol,buy_call_and_put,sell_trade,profit_loss,symbol,match_premium_options

def backtest(start_date, end_date, index_name, interval, sl_in_pct, target_in_pct,exit_time,indicators,input_entry_time,quantity,strike_criteria,premium):
    base_path = Path("../data")
    results = []

    index = index_name.lower()
    index_upper = index_name.upper()

    month_map = {
        "JAN":"01","FEB":"02","MAR":"03","APR":"04",
        "MAY":"05","JUN":"06","JUL":"07","AUG":"08",
        "SEP":"09","OCT":"10","NOV":"11","DEC":"12"
    }

    files = []

    for cash_path in base_path.rglob(f"{index}_cash.feather"):

        day_folder = cash_path.parent
        parts = day_folder.parts

        year = parts[-3]
        month = parts[-2]
        day = parts[-1]

        folder_date = int(year[-2:] + month_map[month] + day)

        files.append((folder_date, cash_path))

    files.sort(key=lambda x: x[0])

    for folder_date, cash_path in files:

        if folder_date < start_date or folder_date > end_date:
            continue

        day_folder = cash_path.parent

        call_path = day_folder / f"{index}_call.feather"
        put_path  = day_folder / f"{index}_put.feather"

        if not (call_path.exists() and put_path.exists()):
            continue

        cash_data = load_cash_data(cash_path, interval)
        cash_data = rsi(cash_data)
        cash_data = bullish_n_bearish(cash_data)
        cash_data = candle_diff_pct(cash_data)

        # if folder_date == 220103:
        #     cash_data.to_csv("cash.csv")

        call_data = load_option_data(call_path, index_upper)
        put_data  = load_option_data(put_path, index_upper)

        if strike_criteria == "ATM":

            new_data_call = match_atm_options(call_data, cash_data, "new_symbol_call")
            new_data_put = match_atm_options(put_data, cash_data, "new_symbol_put")
        
        elif strike_criteria == "premium":

            new_data_call = match_premium_options(call_data, cash_data, "new_symbol_call", premium)
            new_data_put = match_premium_options(call_data, cash_data, "new_symbol_put", premium)

        # if folder_date == 220103:
        #     cash_data.to_csv("cash.csv")

        # if folder_date == 220103:
        #     new_data_call.to_csv("call.csv")
        #     new_data_put.to_csv("put.csv")

        
        entry_time = entry_time_and_signal_symbol(cash_data, indicators, input_entry_time)

        if entry_time is None:
            continue

        exit_time_result = hhmm_to_seconds(exit_time)

        if entry_time >= exit_time_result:
            continue
        
        symbol_result = symbol(cash_data, entry_time,indicators)

        if symbol_result is None:
            continue
        
        if entry_time >= 36000 and entry_time <= 39600:
            buy_call_and_put(cash_data,new_data_put,new_data_call,entry_time,symbol_result,sl_in_pct,target_in_pct)
        else:
            continue
       
        sell_trade(cash_data,new_data_put,new_data_call,symbol_result,entry_time,exit_time_result)

        profit_loss(cash_data,entry_time,quantity)

        row = cash_data[cash_data["time"] == entry_time].iloc[0]

        result_row = {
            "Date": folder_date,
            "Symbol": symbol_result,
            "Buy_Price": row["buy_price"],
            "Stop_Loss": row["stop_loss"],
            "Sell_Price": row["sell_price"],
            "Entry_Time": row["entry_time"],
            "Exit_Time": row["exit_time"],
            "Exit_Reason": row["exit_reason"],
            "Profit_n_Loss": row["profit_n_loss"],
        }

        if "rsi" in indicators:
            result_row["Rsi_Value"] = row["rsi"]

        if "bullish_n_bearish_engulfing" in indicators:
            result_row["Signal"] = row["pattern"]
            result_row["Candle_diff_pct"] = row["candle_diff_pct"]

        results.append(result_row)

    return results



app = Flask(__name__)

@app.route("/backtest", methods=["POST"])
def run_backtest():

    data = request.get_json()

    start_date = int(data.get("start_date"))
    end_date = int(data.get("end_date"))
    index = data.get("index")
    interval = data.get("interval")
    sl_in_pct = data.get("stop_loss_in_pct")
    target_in_pct = data.get("target_in_pct")
    exit_time = data.get("exit_time")
    indicators = data.get("indicators")
    input_entry_time = hhmm_to_seconds(data.get("entry_time"))
    quantity = data.get("quantity")
    strike_criteria = data.get("strike_criteria")
    premium = data.get("premium")

    result = backtest(start_date, end_date, index, interval, sl_in_pct, target_in_pct, exit_time, indicators, input_entry_time, quantity,strike_criteria,premium)

    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)





