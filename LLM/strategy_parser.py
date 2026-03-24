from langchain_groq import ChatGroq
from dotenv import load_dotenv
from prompts import prompt
import os
import json

load_dotenv()

DEFAULT_PARAMS = {
    "start_date": 220101,
    "end_date": 220331,
    "index": "NIFTY",
    "interval": "15min",
    "stop_loss_in_pct": 6,
    "target_in_pct": 36,
    "exit_time": "10:15",
    "indicators": ["bullish_n_bearish_engulfing"],
    "entry_time": "09:15",
    "quantity": 30,
    "strike_criteria": "premium",
    "premium": 250
}

def merge_with_default(user_params):

    params = DEFAULT_PARAMS.copy()

    for key, value in user_params.items():
        if value is not None:
            params[key] = value

    return params


llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY")
)


def parse_strategy(query):

    prompt_template = prompt()

    formatted_prompt = prompt_template.format(query=query)

    response = llm.invoke(formatted_prompt)

    content = response.content.strip()

    if content.startswith("```"):
        content = content.replace("```json", "").replace("```", "").strip()

    user_params = json.loads(content)

    final_params = merge_with_default(user_params)

    return final_params


if __name__ == "__main__":

    query = """
Backtest Banknifty strategy from 01 Jan 2024 to 31 Mar 2024
entry 9:30 and exit 12:00
"""

    result = parse_strategy(query)

    print("\nFinal Parameters:\n")
    print(json.dumps(result, indent=4))