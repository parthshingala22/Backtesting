import pandas as pd
import sqlite3
from datetime import datetime
from flask import Flask,request,jsonify
from flask_cors import CORS
from pathlib import Path
from Common.time import hhmm_to_seconds
from Common.load_option_data import load_option_data
from Common.load_cash_data import load_cash_data
from Common.indicators import rsi,bullish_n_bearish
from Common.candle_diff_pct import candle_diff_pct
from bull_bear import match_atm_options,entry_time_and_signal_symbol,buy_call_and_put,sell_trade,profit_loss,symbol,match_premium_options
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)

def backtest(start_date, end_date, index_name, interval, sl_in_pct, target_in_pct,exit_time,indicators,input_entry_time,quantity,strike_criteria,premium):
# def backtest(start_date, end_date, index_name, interval, sl_in_pct, target_in_pct,exit_time,indicators,entry_start_time,entry_end_time,quantity,strike_criteria,premium):
    
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

    cash_list = []
    call_list = []
    put_list = []
    # date_list = []

    for folder_date, cash_path in files:

        if folder_date < start_date or folder_date > end_date:
            continue

        day_folder = cash_path.parent

        call_path = day_folder / f"{index}_call.feather"
        put_path  = day_folder / f"{index}_put.feather"

        if not (call_path.exists() and put_path.exists()):
            continue

        cash_data = load_cash_data(cash_path, interval)
        call_data = load_option_data(call_path, index_upper)
        put_data  = load_option_data(put_path, index_upper)

        cash_data["date"] = folder_date
        call_data["date"] = folder_date
        put_data["date"] = folder_date

        cash_list.append(cash_data)
        call_list.append(call_data)
        put_list.append(put_data)
    
    cash_data = pd.concat(cash_list, ignore_index=True)
    call_data = pd.concat(call_list, ignore_index=True)
    put_data  = pd.concat(put_list, ignore_index=True)

    cash_data = cash_data.sort_values(["date","time"]).reset_index(drop=True)
    call_data = call_data.sort_values(["date","time"]).reset_index(drop=True)
    put_data = put_data.sort_values(["date","time"]).reset_index(drop=True)

    # cash_data.to_csv("cash.csv")
    # call_data.to_csv("call.csv")
    # put_data.to_csv("put.csv")

    cash_data = rsi(cash_data)
    cash_data = bullish_n_bearish(cash_data)
    cash_data = candle_diff_pct(cash_data)

    if strike_criteria == "ATM":

        new_data_call = match_atm_options(call_data, cash_data, "new_symbol_call")
        new_data_put  = match_atm_options(put_data, cash_data, "new_symbol_put")

    elif strike_criteria == "premium":

        new_data_call = match_premium_options(call_data, cash_data, "new_symbol_call", premium)
        new_data_put  = match_premium_options(put_data, cash_data, "new_symbol_put", premium)

    # new_data_call.to_csv("new_data_call.csv")
    # new_data_put.to_csv("new_data_put.csv")
    # cash_data.to_csv("cash.csv")
    
    for date in cash_data["date"].unique():

        day_cash = cash_data[cash_data["date"] == date].copy()
        day_call = new_data_call[new_data_call["date"] == date].copy()
        day_put = new_data_put[new_data_put["date"] == date].copy()
        
        # if date == 220118:
        #     day_cash.to_csv("day_cash.csv")
        #     day_call.to_csv("day_call.csv")
        #     day_put.to_csv("day_put.csv")

        entry_time = entry_time_and_signal_symbol(day_cash, indicators, input_entry_time)
        # entry_time = entry_time_and_signal_symbol(cash_data, indicators, entry_start_time, entry_end_time)

        if entry_time is None:
            continue

        exit_time_result = hhmm_to_seconds(exit_time)

        if entry_time >= exit_time_result:
            continue

        symbol_result = symbol(day_cash, entry_time, indicators)

        if symbol_result is None:
            continue
        
        buy_call_and_put(day_cash, day_put, day_call,
                        entry_time, symbol_result, sl_in_pct, target_in_pct)

        sell_trade(day_cash, day_put, day_call,
                symbol_result, entry_time, exit_time_result)

        profit_loss(day_cash, entry_time, quantity)

        row = day_cash[day_cash["time"] == entry_time].iloc[0]

        result_row = {
            "Date": int(row["date"]),
            "Symbol": str(symbol_result),
            "Buy_Price": float(row["buy_price"]),
            "Stop_Loss": float(row["stop_loss"]),
            "Sell_Price": float(row["sell_price"]),
            "Entry_Time": row["entry_time"],
            "Exit_Time": row["exit_time"],
            "Exit_Reason": str(row["exit_reason"]),
            "Profit_n_Loss": float(row["profit_n_loss"]),
        }

        if "bullish_n_bearish_engulfing" in indicators and "rsi" in indicators:
            result_row["Rsi_Value"] = float(row["rsi"])
            result_row["Signal"] = str(row["pattern"])
            result_row["Candle_diff_pct"] = float(row["candle_diff_pct"])

        if "rsi" in indicators:
            result_row["Rsi_Value"] = float(row["rsi"])

        if "bullish_n_bearish_engulfing" in indicators:
            result_row["Signal"] = str(row["pattern"])
            result_row["Candle_diff_pct"] = float(row["candle_diff_pct"])

        results.append(result_row)
    
    return results


app = Flask(__name__)
CORS(app)
app.config["JWT_SECRET_KEY"] = "super-secret-key"
jwt = JWTManager(app)

@app.route("/")
def home():
    return {"message": "Flask API running"}



@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE username=? AND password=?",
        (username,password)
    )

    user = cursor.fetchone()

    conn.close()

    if user:

        access_token = create_access_token(identity=username)

        return jsonify({
            "success": True,
            "token": access_token
        })

    return jsonify({"success": False})


@app.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    try:

        cursor.execute(
            "INSERT INTO users (username,password) VALUES (?,?)",
            (username,password)
        )

        conn.commit()

        conn.close()

        return jsonify({"success": True})

    except:

        conn.close()

        return jsonify({
            "success": False,
            "message": "Username already exists"
        })


@app.route("/backtest", methods=["POST","GET"])
@jwt_required()
def run_backtest():

    data = request.get_json()

    start_date = int(data.get("start_date"))
    end_date = int(data.get("end_date"))
    index = data.get("index")
    interval = data.get("interval")
    sl_in_pct = int(data.get("stop_loss_in_pct"))
    target_in_pct = int(data.get("target_in_pct"))
    exit_time = data.get("exit_time")
    indicators = data.get("indicators")
    input_entry_time = hhmm_to_seconds(data.get("entry_time"))
    # entry_start_time = hhmm_to_seconds(data.get("entry_start_time"))
    # entry_end_time = hhmm_to_seconds(data.get("entry_end_time"))
    quantity = int(data.get("quantity"))
    strike_criteria = data.get("strike_criteria")
    premium = int(data.get("premium"))

    result = backtest(start_date, end_date, index, interval, sl_in_pct, target_in_pct, exit_time, indicators, input_entry_time, quantity,strike_criteria,premium)
    # result = backtest(
    #     start_date,
    #     end_date,
    #     index,
    #     interval,
    #     sl_in_pct,
    #     target_in_pct,
    #     exit_time,
    #     indicators,
    #     entry_start_time,
    #     entry_end_time,
    #     quantity,
    #     strike_criteria,
    #     premium
    # )
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True, port=5000)





