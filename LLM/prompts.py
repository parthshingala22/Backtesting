from langchain_core.prompts import PromptTemplate

def prompt():

    template = """
        Convert the following trading strategy into JSON parameters.

        Strategy:
        {query}

        Rules:
        - Return only JSON
        - Do not include explanations
        - Do not use markdown
        - Do not guess the value if value are not given then return Null

        Fields:

        start_date -> formate is yymmdd like 220101 in int, if not then return Null
        end_date -> formate is yymmdd like 220331 in int, if not then return Null
        index -> if not then return Null
        interval -> if not then return Null
        stop_loss_in_pct -> if not then return Null
        target_in_pct -> if not then return Null
        entry_time -> like 09:30, if not then return Null
        exit_time  -> like 15:00, if not then return Null
        indicators  -> return list like ["bullish_n_bearish_engulfing", "rsi"], if not then return Null
        quantity -> if not then return Null
        strike_criteria -> in capital, if not then return Null
        premium -> if not then return Null
        """

    return PromptTemplate.from_template(template)