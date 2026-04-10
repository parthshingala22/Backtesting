# """
# LLM / chatbot.py

# New in this version:
#   - build_context_block now includes the user's saved strategies so the
#     AI can answer questions like "which of my strategies has the best
#     win rate?" or "compare Strategy A with what I have now".
#   - /chatbot/save-strategy  POST  — saves an AI-run strategy result.
# """

# import os, json, re
# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from groq import Groq, RateLimitError, APIStatusError, APIConnectionError, APITimeoutError
# from dotenv import load_dotenv

# load_dotenv()

# chatbot_bp = Blueprint("chatbot", __name__)
# client     = Groq(api_key=os.getenv("GROQ_API_KEY"))

# VALID_INDICES    = ["NIFTY", "BANKNIFTY", "MCX"]
# VALID_INTERVALS  = ["1min", "3min", "5min", "15min"]
# VALID_CRITERIA   = ["ATM", "Premium"]
# VALID_INDICATORS = ["rsi", "bullish_n_bearish_engulfing"]
# MAX_HISTORY_TURNS = 12

# # ── System Prompt ─────────────────────────────────────────────────────────────
# SYSTEM_PROMPT = """You are an expert trading strategy assistant inside a professional NSE options backtesting platform (NIFTY, BANKNIFTY, MCX).

# PERSONALITY:
# - Expert but plain-spoken
# - Always end with one clear next step
# - Never invent numbers — only use data from context

# CAPABILITIES:
# 1. Strategy analysis — entry/exit windows, indicators, strike, SL/target
# 2. Backtest interpretation — PnL, Win Rate, Profit Factor, Max Drawdown
# 3. Optimization — specific parameter improvements with reasoning
# 4. Saved strategy queries — compare, rank, or explain any of the user's saved strategies
# 5. Education — options concepts, indicators, risk management

# SAVED STRATEGIES:
# If the user asks about their saved strategies (e.g. "which strategy is best?",
# "compare my strategies", "what does Strategy X look like?") — use the
# === SAVED STRATEGIES === block from context. Reference strategies by name.

# BACKTEST SUGGESTION PROTOCOL:
# When the user asks you to suggest, optimize, or run different parameters — set suggested_params.
# Only include fields you want to change (not the full form).

# suggested_params schema (all fields optional):
#   start_date / end_date : integer YYMMDD (e.g. 220101)
#   index                 : "NIFTY" | "BANKNIFTY" | "MCX"
#   interval              : "1min" | "3min" | "5min" | "15min"
#   entry_start_time / entry_end_time / exit_time : "HH:MM"
#   strike_criteria       : "ATM" | "Premium (e.g. 200,250)"
#   stop_loss_in_pct      : number 1-100
#   target_in_pct         : number 1-100
#   quantity              : integer 1-100
#   indicators            : array — valid values: "rsi", "bullish_n_bearish_engulfing"

# OUTPUT FORMAT — respond ONLY with a valid JSON object, nothing outside it:
# {
#   "reply": "your response as a plain string",
#   "suggested_params": { ...fields... } or null
# }

# REPLY FORMATTING:
# - Use bullet lines, each separated by \\n
# - Wrap key terms/numbers in **double asterisks** for bold
# - Structure: one intro line → \\n\\n → bullets → \\n\\n → closing line
# - Max 220 words. Use Rs. for rupees.
# - No markdown headers, no dashes as bullets, no triple backticks in reply
# - NEVER put JSON inside the reply string

# EXAMPLE:
# {"reply": "Your **win rate is 38%** — below the 50% threshold.\\n\\n• **Stop Loss 10%** is too wide; price hits SL before reaching target\\n• **No indicators** means entries are purely time-based\\n• **Entry window** 09:15-10:15 captures volatile open — consider 09:30 start\\n\\nI suggest SL 6%, target 15%, add RSI. Want me to run a test?", "suggested_params": {"stop_loss_in_pct": 6, "target_in_pct": 15, "indicators": ["rsi"]}}
# """


# # ── Helpers ───────────────────────────────────────────────────────────────────

# def trim_messages(messages: list, max_turns: int) -> list:
#     if len(messages) <= max_turns:
#         return messages
#     return messages[:1] + messages[-(max_turns - 1):]


# def extract_json(raw: str) -> dict:
#     text = raw.strip()
#     text = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.IGNORECASE)
#     text = re.sub(r"\n?```\s*$", "", text)
#     text = text.strip()

#     try:
#         obj = json.loads(text)
#         if isinstance(obj, dict) and "reply" in obj:
#             return obj
#     except json.JSONDecodeError:
#         pass

#     depth, start = 0, -1
#     for i, ch in enumerate(text):
#         if ch == "{":
#             if depth == 0:
#                 start = i
#             depth += 1
#         elif ch == "}":
#             depth -= 1
#             if depth == 0 and start != -1:
#                 candidate = text[start:i+1]
#                 try:
#                     obj = json.loads(candidate)
#                     if isinstance(obj, dict) and "reply" in obj:
#                         return obj
#                 except json.JSONDecodeError:
#                     pass
#                 break

#     clean = re.sub(r'\{.*?\}', '', text, flags=re.DOTALL).strip()
#     return {"reply": clean or text, "suggested_params": None}


# def sanitize_params(params: dict, current_form: dict) -> dict | None:
#     if not params or not isinstance(params, dict):
#         return None
#     merged = dict(current_form) if current_form else {}
#     if params.get("index") in VALID_INDICES:
#         merged["index"] = params["index"]
#     if params.get("interval") in VALID_INTERVALS:
#         merged["interval"] = params["interval"]
#     if params.get("strike_criteria") in VALID_CRITERIA:
#         merged["strike_criteria"] = params["strike_criteria"]
#     if isinstance(params.get("indicators"), list):
#         merged["indicators"] = [i for i in params["indicators"] if i in VALID_INDICATORS]
#     for field in ("start_date", "end_date"):
#         if field in params:
#             try:
#                 merged[field] = int(params[field])
#             except (ValueError, TypeError):
#                 pass
#     for field in ("stop_loss_in_pct", "target_in_pct"):
#         if field in params:
#             try:
#                 val = float(params[field])
#                 if 0 < val <= 100:
#                     merged[field] = round(val, 2)
#             except (ValueError, TypeError):
#                 pass
#     if "quantity" in params:
#         try:
#             val = int(params["quantity"])
#             if 1 <= val <= 1000:
#                 merged["quantity"] = val
#         except (ValueError, TypeError):
#             pass
#     for field in ("entry_start_time", "entry_end_time", "exit_time"):
#         if isinstance(params.get(field), str) and re.match(r"^\d{2}:\d{2}$", params[field]):
#             merged[field] = params[field]
#     return merged


# def build_context_block(form: dict, results_summary: dict, saved_strategies: list) -> str:
#     lines = []

#     if form:
#         lines.append("=== CURRENT STRATEGY ===")
#         lines.append(f"Index: {form.get('index')}  Interval: {form.get('interval')}")
#         lines.append(f"Dates: {form.get('start_date')} to {form.get('end_date')}")
#         lines.append(
#             f"Entry: {form.get('entry_start_time')} to {form.get('entry_end_time')}  "
#             f"Exit: {form.get('exit_time')}"
#         )
#         lines.append(
#             f"Strike: {form.get('strike_criteria', 'ATM')}  "
#             f"SL: {form.get('stop_loss_in_pct')}%  "
#             f"Target: {form.get('target_in_pct')}%  "
#             f"Lots: {form.get('quantity')}"
#         )
#         inds = form.get("indicators") or []
#         lines.append(f"Indicators: {', '.join(inds) if inds else 'None'}")

#     if results_summary:
#         r = results_summary
#         lines.append("=== CURRENT BACKTEST RESULTS ===")
#         lines.append(
#             f"Trades: {r.get('total_trades')}  Win: {r.get('win_trades')}  "
#             f"Loss: {r.get('loss_trades')}  WinRate: {r.get('win_rate')}%"
#         )
#         lines.append(
#             f"PnL: Rs.{r.get('total_pnl')}  "
#             f"Profit: Rs.{r.get('gross_profit')}  "
#             f"Loss: Rs.{r.get('gross_loss')}"
#         )
#         for t in (r.get("sample_trades") or []):
#             lines.append(
#                 f"  {t.get('Date')} {t.get('Symbol')} "
#                 f"{t.get('Entry_Time')}-{t.get('Exit_Time')} "
#                 f"PnL:Rs.{t.get('Profit_n_Loss')} {t.get('Exit_Reason')}"
#             )

#     # Inject saved strategies — compact one-line per strategy
#     if saved_strategies:
#         lines.append("=== SAVED STRATEGIES ===")
#         for s in saved_strategies:
#             name = s.get("name", "Unnamed")
#             f    = s.get("formData") or {}
#             inds = f.get("indicators") or []
#             lines.append(
#                 f'Strategy "{name}": '
#                 f'Index={f.get("index")} Interval={f.get("interval")} '
#                 f'Dates={f.get("start_date")}-{f.get("end_date")} '
#                 f'Entry={f.get("entry_start_time")}-{f.get("entry_end_time")} '
#                 f'Exit={f.get("exit_time")} '
#                 f'Strike={f.get("strike_criteria","ATM")} '
#                 f'SL={f.get("stop_loss_in_pct")}% Target={f.get("target_in_pct")}% '
#                 f'Lots={f.get("quantity")} '
#                 f'Indicators={", ".join(inds) if inds else "None"}'
#             )

#     return "\n".join(lines)


# # ── Routes ────────────────────────────────────────────────────────────────────

# @chatbot_bp.route("/chatbot", methods=["POST"])
# @jwt_required()
# def chatbot():
#     data             = request.get_json(force=True, silent=True) or {}
#     messages         = data.get("messages", [])
#     context          = data.get("context") or {}
#     current_form     = context.get("form") or {}
#     results_summary  = context.get("results_summary")
#     saved_strategies = context.get("saved_strategies") or []

#     if not messages:
#         return jsonify({"reply": "No message received.", "suggested_params": None})

#     messages    = trim_messages(messages, MAX_HISTORY_TURNS)
#     ctx_block   = build_context_block(current_form, results_summary, saved_strategies)
#     system_text = SYSTEM_PROMPT + (f"\n\n{ctx_block}" if ctx_block else "")

#     groq_msgs = [{"role": "system", "content": system_text}]
#     for msg in messages:
#         role    = msg.get("role")
#         content = msg.get("content", "").strip()
#         if role in ("user", "assistant") and content:
#             groq_msgs.append({"role": role, "content": content})

#     try:
#         completion = client.chat.completions.create(
#             model="llama-3.3-70b-versatile",
#             messages=groq_msgs,
#             temperature=0.55,
#             max_tokens=700,
#         )
#         choice = completion.choices[0]
#         raw    = (choice.message.content or "").strip()

#         if choice.finish_reason == "length":
#             print(f"[Chatbot WARN] Truncated. Raw: {raw[:200]}")

#         if not raw:
#             return jsonify({"reply": "I received an empty response. Please rephrase your question.", "suggested_params": None})

#         parsed       = extract_json(raw)
#         reply        = (parsed.get("reply") or "").strip() or raw[:500]
#         raw_params   = parsed.get("suggested_params")
#         clean_params = sanitize_params(raw_params, current_form) if raw_params else None

#         return jsonify({"reply": reply, "suggested_params": clean_params})

#     except RateLimitError:
#         return jsonify({"reply": "Rate-limited. Please wait a few seconds and try again.", "suggested_params": None})
#     except APITimeoutError:
#         return jsonify({"reply": "Request timed out. Please try again.", "suggested_params": None})
#     except APIConnectionError:
#         return jsonify({"reply": "Could not reach the AI server. Check your connection.", "suggested_params": None})
#     except APIStatusError as e:
#         status = e.status_code
#         if status == 400:
#             return jsonify({"reply": "Conversation too long — please clear the chat and try again.", "suggested_params": None})
#         if status == 401:
#             return jsonify({"reply": "Invalid GROQ_API_KEY. Check your .env file.", "suggested_params": None})
#         return jsonify({"reply": f"AI error (HTTP {status}). Please try again.", "suggested_params": None})
#     except Exception as e:
#         print(f"[Chatbot] Unexpected: {type(e).__name__}: {e}")
#         return jsonify({"reply": "Unexpected error. Check server logs.", "suggested_params": None})


# @chatbot_bp.route("/chatbot/save-strategy", methods=["POST"])
# @jwt_required()
# def save_strategy_from_chat():
#     """
#     Save a strategy that was run through the chatbot.
#     Body: { name: str, formData: dict }
#     Reuses the same /strategies POST logic so it appears in MyStrategies.
#     """
#     data = request.get_json(force=True, silent=True) or {}
#     name      = (data.get("name") or "").strip()
#     form_data = data.get("formData")

#     if not name:
#         return jsonify({"success": False, "error": "Strategy name is required"}), 400
#     if not form_data or not isinstance(form_data, dict):
#         return jsonify({"success": False, "error": "formData is required"}), 400

#     # Re-use the existing strategies endpoint internally
#     # Import here to avoid circular imports depending on your app structure
#     try:
#         from flask import current_app
#         token = request.headers.get("Authorization", "")

#         import requests as req_lib
#         host     = current_app.config.get("SERVER_NAME") or "localhost:5000"
#         protocol = "https" if current_app.config.get("PREFERRED_URL_SCHEME") == "https" else "http"
#         url      = f"{protocol}://{host}/strategies"

#         resp = req_lib.post(
#             url,
#             json={"name": name, "formData": form_data},
#             headers={"Authorization": token, "Content-Type": "application/json"},
#             timeout=10
#         )
#         result = resp.json()
#         return jsonify(result), resp.status_code

#     except Exception:
#         # Fallback: call the DB/logic directly if you have a save_strategy() helper
#         # or duplicate the save logic from your strategies route here.
#         return jsonify({"success": False, "error": "Could not save strategy. Check server logs."}), 500


"""
LLM / chatbot.py

CORRECT FLOW:
  1. User: "run this strategy" / "run Premium strategy"
     AI: replies with confirmation text + suggested_params = the FULL current/saved params
     Frontend: shows RunCard with all params → user clicks "Run Backtest"
     Frontend: actually calls /backtest, shows InlineReport, then calls /chatbot/analyze

  2. /chatbot/analyze  POST  — called automatically after a real backtest completes.
     AI: gets the real results and replies with analysis + optional suggested_params
     Frontend: shows analysis bubble, then if suggested_params → shows SuggestionCard

  3. User: "yes" / "optimize" after analysis
     AI: replies with suggested_params = tweaked params
     Frontend: shows SuggestionCard → user clicks Run → real backtest again

RULE ENFORCED IN PROMPT:
  - AI must NEVER fabricate backtest results (no fake PnL, win rate, drawdown, etc.)
  - AI must NEVER say "running backtest" or "backtest in progress" — the frontend runs it
  - When user says "run [strategy]", AI MUST set suggested_params to the full strategy params
"""

import os, json, re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from groq import Groq, RateLimitError, APIStatusError, APIConnectionError, APITimeoutError
from dotenv import load_dotenv

load_dotenv()

chatbot_bp = Blueprint("chatbot", __name__)
client     = Groq(api_key=os.getenv("GROQ_API_KEY"))

VALID_INDICES    = ["NIFTY", "BANKNIFTY", "MCX"]
VALID_INTERVALS  = ["1min", "3min", "5min", "15min"]
VALID_CRITERIA   = ["ATM", "Premium"]
VALID_INDICATORS = ["rsi", "bullish_n_bearish_engulfing"]
MAX_HISTORY_TURNS = 12

# ── System Prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert trading strategy assistant inside a professional options backtesting platform (NIFTY, BANKNIFTY, MCX).

PERSONALITY:
- Expert but plain-spoken
- Always end with one clear next step
- NEVER fabricate or guess numbers — only use real data from context

━━━ CRITICAL RULES — READ CAREFULLY ━━━

RULE 1 — NEVER FAKE RESULTS:
You do NOT run backtests. The platform runs them. You must NEVER invent or guess:
  - Win rate, PnL, profit factor, drawdown, trade counts, average profit
  - Any number that looks like a backtest result
If you don't have real results in the context block, you cannot say what the results are.

RULE 2 — "RUN" INTENT → suggested_params REQUIRED:
When the user says anything like:
  "run this strategy", "run it", "run Premium strategy", "backtest this",
  "run the current strategy", "run [strategy name]", "test this", "execute"
You MUST:
  a) Set suggested_params to the COMPLETE parameters of the strategy they want to run
     (copy ALL fields from context — current strategy or the named saved strategy)
  b) Write a reply like: "Here are the parameters for [name]. Click **Run Backtest** to execute it."
  c) Do NOT say "running...", "in progress...", "wait...", or pretend to run anything
  d) Do NOT give any results — you don't have them yet

RULE 3 — "YES/OPTIMIZE" AFTER ANALYSIS → suggested_params with CHANGES ONLY:
When the user confirms they want to try suggested improvements (yes, go ahead, optimize, try it):
  a) Set suggested_params to only the fields you want to change
  b) Reply: "Here are the optimized parameters. Click **Run Backtest** to test them."

RULE 4 — ANALYSIS (after real results are provided in context):
When the context contains real backtest results (=== CURRENT BACKTEST RESULTS ===):
  a) Analyze the actual numbers — win rate, PnL, drawdown
  b) Point out specific weaknesses with reasoning
  c) End with a suggestion and ask if they want to test it
  d) Set suggested_params to your recommended changes (optional — only if you have a specific suggestion)

━━━ suggested_params schema (all fields optional) ━━━
  start_date / end_date : integer YYMMDD (e.g. 220101)
  index                 : "NIFTY" | "BANKNIFTY" | "MCX"
  interval              : "1min" | "3min" | "5min" | "15min"
  entry_start_time / entry_end_time / exit_time : "HH:MM"
  strike_criteria       : "ATM" | "Premium"
  stop_loss_in_pct      : number 1-100
  target_in_pct         : number 1-100
  quantity              : integer 1-100
  indicators            : array — valid values: "rsi", "bullish_n_bearish_engulfing"

━━━ OUTPUT FORMAT ━━━
Always respond with ONLY a valid JSON object — no text outside it:
{
  "reply": "your response as a plain string",
  "suggested_params": { ...fields... } or null
}

━━━ REPLY FORMATTING ━━━
- Use "• item" bullet lines separated by \\n
- Wrap key terms/numbers in **double asterisks** for bold
- Structure: intro line → \\n\\n → bullets → \\n\\n → closing line
- Max 200 words. Use Rs. for rupees.
- No markdown headers, no dashes as bullets, no code fences in reply
- NEVER put JSON inside the reply string

━━━ EXAMPLES ━━━

User: "run this strategy"
CORRECT: {"reply": "Here are the current strategy parameters. Click **Run Backtest** to execute it.", "suggested_params": {"index": "NIFTY", "interval": "15min", "start_date": 220101, "end_date": 220131, "entry_start_time": "09:15", "entry_end_time": "10:15", "exit_time": "10:15", "strike_criteria": "Premium", "stop_loss_in_pct": 6, "target_in_pct": 36, "quantity": 10, "indicators": ["bullish_n_bearish_engulfing"]}}
WRONG: {"reply": "Running backtest... your win rate is 42%...", "suggested_params": null}

User: "run Premium strategy"
CORRECT: {"reply": "Here are the **Premium** strategy parameters. Click **Run Backtest** to execute it.", "suggested_params": {/* all Premium strategy fields from context */}}
WRONG: {"reply": "Backtest in progress...", "suggested_params": null}

User: "yes" (after analysis suggesting SL 8% target 30%)
CORRECT: {"reply": "Here are the optimized parameters with **SL 8%** and **Target 30%**. Click **Run Backtest** to test them.", "suggested_params": {"stop_loss_in_pct": 8, "target_in_pct": 30}}
"""

# ── Analysis prompt — used by /chatbot/analyze ────────────────────────────────
ANALYSIS_PROMPT = """You are an expert trading strategy assistant. Real backtest results have just been returned.

Analyze the results honestly and specifically. Do NOT suggest running a backtest — it just ran.

Your response should:
1. Comment on the key metrics: Win Rate, Total PnL, Profit Factor, Max Drawdown
2. Identify 2-3 specific weaknesses or strengths
3. End with a concrete optimization suggestion and ask if they want to test it
4. If you have a clear suggestion, set suggested_params to ONLY the fields you want to change

Use the same JSON output format:
{"reply": "...", "suggested_params": {...} or null}

FORMATTING: bullets with •, **bold** for numbers, max 200 words, Rs. for rupees.
"""


# ── Helpers ───────────────────────────────────────────────────────────────────

def trim_messages(messages: list, max_turns: int) -> list:
    if len(messages) <= max_turns:
        return messages
    return messages[:1] + messages[-(max_turns - 1):]


def extract_json(raw: str) -> dict:
    text = raw.strip()
    text = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\n?```\s*$", "", text)
    text = text.strip()
    try:
        obj = json.loads(text)
        if isinstance(obj, dict) and "reply" in obj:
            return obj
    except json.JSONDecodeError:
        pass
    # Brace-depth scanner
    depth, start = 0, -1
    for i, ch in enumerate(text):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start != -1:
                candidate = text[start:i+1]
                try:
                    obj = json.loads(candidate)
                    if isinstance(obj, dict) and "reply" in obj:
                        return obj
                except json.JSONDecodeError:
                    pass
                break
    clean = re.sub(r'\{.*?\}', '', text, flags=re.DOTALL).strip()
    return {"reply": clean or text, "suggested_params": None}


def sanitize_params(params: dict, current_form: dict) -> dict | None:
    if not params or not isinstance(params, dict):
        return None
    merged = dict(current_form) if current_form else {}
    if params.get("index") in VALID_INDICES:
        merged["index"] = params["index"]
    if params.get("interval") in VALID_INTERVALS:
        merged["interval"] = params["interval"]
    if params.get("strike_criteria") in VALID_CRITERIA:
        merged["strike_criteria"] = params["strike_criteria"]
    if isinstance(params.get("indicators"), list):
        merged["indicators"] = [i for i in params["indicators"] if i in VALID_INDICATORS]
    for field in ("start_date", "end_date"):
        if field in params:
            try:
                merged[field] = int(params[field])
            except (ValueError, TypeError):
                pass
    for field in ("stop_loss_in_pct", "target_in_pct"):
        if field in params:
            try:
                val = float(params[field])
                if 0 < val <= 100:
                    merged[field] = round(val, 2)
            except (ValueError, TypeError):
                pass
    if "quantity" in params:
        try:
            val = int(params["quantity"])
            if 1 <= val <= 1000:
                merged["quantity"] = val
        except (ValueError, TypeError):
            pass
    for field in ("entry_start_time", "entry_end_time", "exit_time"):
        if isinstance(params.get(field), str) and re.match(r"^\d{2}:\d{2}$", params[field]):
            merged[field] = params[field]
    return merged if merged != (current_form or {}) else merged


def build_context_block(form: dict, results_summary: dict, saved_strategies: list) -> str:
    lines = []
    if form:
        lines.append("=== CURRENT STRATEGY ===")
        lines.append(f"Index: {form.get('index')}  Interval: {form.get('interval')}")
        lines.append(f"Dates: {form.get('start_date')} to {form.get('end_date')}")
        lines.append(f"Entry: {form.get('entry_start_time')} to {form.get('entry_end_time')}  Exit: {form.get('exit_time')}")
        lines.append(f"Strike: {form.get('strike_criteria','ATM')}  SL: {form.get('stop_loss_in_pct')}%  Target: {form.get('target_in_pct')}%  Lots: {form.get('quantity')}")
        inds = form.get("indicators") or []
        lines.append(f"Indicators: {', '.join(inds) if inds else 'None'}")

    if results_summary:
        r = results_summary
        lines.append("=== CURRENT BACKTEST RESULTS ===")
        lines.append(f"Trades: {r.get('total_trades')}  Win: {r.get('win_trades')}  Loss: {r.get('loss_trades')}  WinRate: {r.get('win_rate')}%")
        lines.append(f"PnL: Rs.{r.get('total_pnl')}  Profit: Rs.{r.get('gross_profit')}  Loss: Rs.{r.get('gross_loss')}")
        lines.append(f"Profit Factor: {r.get('profit_factor')}  Max Drawdown: Rs.{r.get('max_drawdown')}")
        for t in (r.get("sample_trades") or []):
            lines.append(f"  {t.get('Date')} {t.get('Symbol')} {t.get('Entry_Time')}-{t.get('Exit_Time')} PnL:Rs.{t.get('Profit_n_Loss')} {t.get('Exit_Reason')}")

    if saved_strategies:
        lines.append("=== SAVED STRATEGIES ===")
        for s in saved_strategies:
            name = s.get("name", "Unnamed")
            f    = s.get("formData") or {}
            inds = f.get("indicators") or []
            lines.append(
                f'Strategy "{name}": Index={f.get("index")} Interval={f.get("interval")} '
                f'Dates={f.get("start_date")}-{f.get("end_date")} '
                f'Entry={f.get("entry_start_time")}-{f.get("entry_end_time")} Exit={f.get("exit_time")} '
                f'Strike={f.get("strike_criteria","ATM")} SL={f.get("stop_loss_in_pct")}% '
                f'Target={f.get("target_in_pct")}% Lots={f.get("quantity")} '
                f'Indicators={", ".join(inds) if inds else "None"}'
            )
    return "\n".join(lines)


def call_groq(system: str, messages: list) -> dict:
    """Shared Groq call — returns parsed {reply, suggested_params}."""
    groq_msgs = [{"role": "system", "content": system}]
    for msg in messages:
        role    = msg.get("role")
        content = msg.get("content", "").strip()
        if role in ("user", "assistant") and content:
            groq_msgs.append({"role": role, "content": content})

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=groq_msgs,
        temperature=0.5,
        max_tokens=700,
    )
    choice = completion.choices[0]
    raw    = (choice.message.content or "").strip()
    if choice.finish_reason == "length":
        print(f"[Chatbot WARN] Truncated: {raw[:150]}")
    if not raw:
        return {"reply": "I received an empty response. Please try again.", "suggested_params": None}
    parsed = extract_json(raw)
    return {
        "reply":            (parsed.get("reply") or "").strip() or raw[:400],
        "suggested_params": parsed.get("suggested_params"),
    }


def handle_groq_error(e: Exception) -> dict:
    if isinstance(e, RateLimitError):
        return {"reply": "Rate-limited. Please wait a few seconds and try again.", "suggested_params": None}
    if isinstance(e, APITimeoutError):
        return {"reply": "Request timed out. Please try again.", "suggested_params": None}
    if isinstance(e, APIConnectionError):
        return {"reply": "Could not reach the AI server. Check your connection.", "suggested_params": None}
    if isinstance(e, APIStatusError):
        if e.status_code == 400:
            return {"reply": "Conversation too long — please clear the chat and try again.", "suggested_params": None}
        if e.status_code == 401:
            return {"reply": "Invalid GROQ_API_KEY. Check your .env file.", "suggested_params": None}
        return {"reply": f"AI error (HTTP {e.status_code}). Please try again.", "suggested_params": None}
    print(f"[Chatbot] Unexpected: {type(e).__name__}: {e}")
    return {"reply": "Unexpected error. Check server logs.", "suggested_params": None}


# ── Routes ────────────────────────────────────────────────────────────────────

@chatbot_bp.route("/chatbot", methods=["POST"])
@jwt_required()
def chatbot():
    data             = request.get_json(force=True, silent=True) or {}
    messages         = data.get("messages", [])
    context          = data.get("context") or {}
    current_form     = context.get("form") or {}
    results_summary  = context.get("results_summary")
    saved_strategies = context.get("saved_strategies") or []

    if not messages:
        return jsonify({"reply": "No message received.", "suggested_params": None})

    messages    = trim_messages(messages, MAX_HISTORY_TURNS)
    ctx_block   = build_context_block(current_form, results_summary, saved_strategies)
    system_text = SYSTEM_PROMPT + (f"\n\n{ctx_block}" if ctx_block else "")

    try:
        result       = call_groq(system_text, messages)
        raw_params   = result.get("suggested_params")
        clean_params = sanitize_params(raw_params, current_form) if raw_params else None
        return jsonify({"reply": result["reply"], "suggested_params": clean_params})
    except Exception as e:
        return jsonify(handle_groq_error(e))


@chatbot_bp.route("/chatbot/analyze", methods=["POST"])
@jwt_required()
def analyze_results():
    """
    Called automatically by the frontend after a real backtest completes.
    Body: { form, results_summary, saved_strategies }
    Returns analysis of the REAL results + optional suggested_params.
    """
    data             = request.get_json(force=True, silent=True) or {}
    current_form     = data.get("form") or {}
    results_summary  = data.get("results_summary") or {}
    saved_strategies = data.get("saved_strategies") or []

    if not results_summary:
        return jsonify({"reply": "No results to analyze.", "suggested_params": None})

    ctx_block   = build_context_block(current_form, results_summary, saved_strategies)
    system_text = ANALYSIS_PROMPT + (f"\n\n{ctx_block}" if ctx_block else "")

    # Single user message asking for analysis
    analysis_msgs = [{"role": "user", "content": "Please analyze these backtest results and suggest improvements."}]

    try:
        result       = call_groq(system_text, analysis_msgs)
        raw_params   = result.get("suggested_params")
        clean_params = sanitize_params(raw_params, current_form) if raw_params else None
        return jsonify({"reply": result["reply"], "suggested_params": clean_params})
    except Exception as e:
        return jsonify(handle_groq_error(e))