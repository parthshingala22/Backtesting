import pandas as pd

def hhmm_to_seconds(time_str):
    t = pd.to_datetime(time_str, format="%H:%M")
    return t.hour * 3600 + t.minute * 60

def seconds_to_hhmm(seconds):
    return pd.to_datetime(seconds, unit="s").strftime("%H:%M")

# print(seconds_to_hhmm(38400))

# hhmm_to_seconds("11:00")

# print(hhmm_to_seconds("10:00"))
# print(hhmm_to_seconds("11:00"))