import streamlit as st

st.set_page_config(page_title="Options Backtesting", layout="wide")

st.title("📈 Options Strategy Backtester")

st.markdown("---")



st.subheader("📅 Backtest Period")

col1, col2 = st.columns(2)

with col1:
    start_date = st.number_input("Start Date (YYMMDD)", value=240101)

with col2:
    end_date = st.number_input("End Date (YYMMDD)", value=240131)




st.subheader("📊 Market Settings")

col1, col2, col3 = st.columns(3)

with col1:
    index = st.selectbox(
        "Index",
        ["NIFTY", "BANKNIFTY", "MCX"]
    )

with col2:
    interval = st.selectbox(
        "Candle Interval",
        ["1min", "3min", "5min", "15min"]
    )

with col3:
    indicators = st.multiselect(
        "Indicators",
        ["RSI", "Bullish & Bearish Engulfing"]
    )



st.subheader("⏰ Trade Entry")

col1, col2 = st.columns(2)

with col1:
    entry_time = st.time_input("Entry Time")

with col2:
    exit_time = st.time_input("Exit Time")



st.subheader("📌 Strike Criteria")

col1, col2 = st.columns(2)

with col1:
    strike_mode = st.selectbox(
        "Selection Method",
        ["Strike Type", "Premium Based"]
    )

with col2:
    if strike_mode == "Strike Type":
        strike_criteria = st.selectbox(
            "Strike Type",
            ["ATM", "ITM", "OTM"]
        )
        premium = None

    else:
        premium = st.number_input(
            "Premium",
            min_value=1,
            value=100
        )
        strike_criteria = None


st.subheader("⚠ Risk Management")

col1, col2 = st.columns(2)

with col1:
    sl_in_pct = st.number_input(
        "Stop Loss (%)",
        value=20
    )

with col2:
    target_in_pct = st.number_input(
        "Target (%)",
        value=40
    )


# -------------------------------
# POSITION SETTINGS
# -------------------------------

st.subheader("📦 Position Size")

quantity = st.number_input("Quantity", value=50)


# -------------------------------
# RUN BUTTON
# -------------------------------

st.markdown("---")

if st.button("🚀 Run Backtest", use_container_width=True):

    inputs = {
        "start_date": start_date,
        "end_date": end_date,
        "index": index,
        "interval": interval,
        "stop_loss_in_pct": sl_in_pct,
        "target_in_pct": target_in_pct,
        "exit_time": str(exit_time),
        "indicators": indicators,
        "entry_time": str(entry_time),
        "quantity": quantity,
        "strike_criteria": strike_criteria,
        "premium": premium
    }

    st.success("Backtest Started")

    st.json(inputs)