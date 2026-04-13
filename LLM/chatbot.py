# """
# LLM / chatbot.py

# BUG FIXES in this version:
#   1. sanitize_params now returns ONLY the validated raw changes from the AI
#      (not the full merged form). This is what the SuggestionCard needs —
#      it shows old→new diffs, so it must receive only the changed fields.
#      The frontend is responsible for merging these changes onto the current
#      form before actually calling /backtest.

#   2. The /chatbot/analyze route already only asks the AI to return changed
#      fields (ANALYSIS_PROMPT rule 4). This fix ensures those changes are
#      returned as-is instead of being silently merged with the current form.

#   For "run" intent (RunCard), the AI returns ALL strategy fields — those
#   are validated and returned in full so the RunCard can display everything
#   and the frontend can call /backtest directly with them.
# """

# import os, json, re
# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required
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
# SYSTEM_PROMPT = """You are an expert trading strategy assistant inside a professional options backtesting platform (NIFTY, BANKNIFTY, MCX).

# PERSONALITY:
# - Expert but plain-spoken
# - Always end with one clear next step
# - NEVER fabricate or guess numbers — only use real data from context

# ━━━ CRITICAL RULES ━━━

# RULE 1 — NEVER FAKE RESULTS:
# You do NOT run backtests. The platform runs them. NEVER invent Win rate, PnL, profit factor, drawdown, or trade counts.

# RULE 2 — "RUN" INTENT → suggested_params with ALL strategy fields:
# When user says "run this strategy", "run it", "run [name] strategy", "backtest this", "test this":
#   a) Set suggested_params to ALL parameters of the strategy (copy every field from context)
#   b) Reply: "Here are the parameters for [name]. Click **Run Backtest** to execute it."
#   c) Do NOT say "running...", "in progress...", or pretend to run anything

# RULE 3 — OPTIMIZATION SUGGESTION → suggested_params with ONLY CHANGED FIELDS:
# When suggesting parameter improvements (after analysis, or user asks to optimize):
#   a) Set suggested_params to ONLY the fields you want to change — NOT the full form
#   b) Example: if suggesting SL 5%, only return {"stop_loss_in_pct": 5}
#   c) Example: if suggesting SL 5% and RSI, return {"stop_loss_in_pct": 5, "indicators": ["rsi"]}
#   d) Reply: "Here are the optimized parameters. Click **Run Backtest** to test them."

# RULE 4 — "YES/CONFIRM" AFTER ANALYSIS:
# When user says yes/go/run to your optimization suggestion, return suggested_params with ONLY the changed fields you previously recommended.

# ━━━ suggested_params schema ━━━
# For RUN intent — include ALL fields:
#   start_date, end_date : integer YYMMDD
#   index                : "NIFTY" | "BANKNIFTY" | "MCX"
#   interval             : "1min" | "3min" | "5min" | "15min"
#   entry_start_time, entry_end_time, exit_time : "HH:MM"
#   strike_criteria      : "ATM" | "Premium"
#   stop_loss_in_pct     : number 1-100
#   target_in_pct        : number 1-100
#   quantity             : integer 1-100
#   indicators           : array of "rsi" | "bullish_n_bearish_engulfing"

# For OPTIMIZATION — include ONLY changed fields (same field names as above).

# ━━━ OUTPUT FORMAT ━━━
# Always respond ONLY with valid JSON — no text outside it:
# {"reply": "plain text string", "suggested_params": {...} or null}

# ━━━ REPLY FORMATTING ━━━
# - Use "• item" bullet lines separated by \\n
# - Wrap key terms/numbers in **double asterisks** for bold
# - Structure: intro line → \\n\\n → bullets → \\n\\n → closing line
# - Max 200 words. Use Rs. for rupees.
# - No markdown headers, no dashes as bullets, no code fences in reply

# ━━━ EXAMPLES ━━━
# Run intent: {"reply": "Here are the **Premium** strategy parameters. Click **Run Backtest** to execute.", "suggested_params": {"index": "NIFTY", "interval": "15min", "start_date": 220101, "end_date": 220131, "entry_start_time": "09:15", "entry_end_time": "10:15", "exit_time": "10:15", "strike_criteria": "Premium", "stop_loss_in_pct": 6, "target_in_pct": 36, "quantity": 10, "indicators": ["bullish_n_bearish_engulfing"]}}

# Optimization (only changes): {"reply": "I suggest reducing **SL to 5%** and adding **RSI** to filter entries.", "suggested_params": {"stop_loss_in_pct": 5, "indicators": ["rsi"]}}

# NOT this (full form for optimization): {"reply": "...", "suggested_params": {"index": "NIFTY", "interval": "15min", ..., "stop_loss_in_pct": 5}}
# """

# # ── Analysis prompt ────────────────────────────────────────────────────────────
# ANALYSIS_PROMPT = """You are an expert trading strategy assistant. Real backtest results have just been returned.

# Analyze the results honestly. Do NOT suggest running a backtest — it just ran.

# Your analysis should:
# 1. Comment on Win Rate, Total PnL, Profit Factor, Max Drawdown using the REAL numbers from context
# 2. Identify 2-3 specific weaknesses or strengths with reasoning
# 3. End with a concrete optimization suggestion

# IMPORTANT FOR suggested_params:
# - Return ONLY the fields you want to change, not the full strategy
# - Example: if suggesting SL 5%, return {"stop_loss_in_pct": 5}
# - Example: if suggesting SL 5% and target 20%, return {"stop_loss_in_pct": 5, "target_in_pct": 20}
# - If you have no specific change, return null

# Output format (only valid JSON, nothing outside):
# {"reply": "...", "suggested_params": {ONLY changed fields} or null}

# FORMATTING: bullets with •, **bold** for numbers, max 200 words, Rs. for rupees.
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


# def validate_params(params: dict) -> dict | None:
#     """
#     Validate the AI's suggested_params fields WITHOUT merging onto the current form.
#     Returns only the validated fields that were present in params.
#     The frontend is responsible for merging these onto the current form before running.
#     """
#     if not params or not isinstance(params, dict):
#         return None

#     clean = {}

#     if params.get("index") in VALID_INDICES:
#         clean["index"] = params["index"]
#     if params.get("interval") in VALID_INTERVALS:
#         clean["interval"] = params["interval"]
#     if params.get("strike_criteria") in VALID_CRITERIA:
#         clean["strike_criteria"] = params["strike_criteria"]
#     if isinstance(params.get("indicators"), list):
#         valid_inds = [i for i in params["indicators"] if i in VALID_INDICATORS]
#         clean["indicators"] = valid_inds

#     for field in ("start_date", "end_date"):
#         if field in params:
#             try:
#                 clean[field] = int(params[field])
#             except (ValueError, TypeError):
#                 pass

#     for field in ("stop_loss_in_pct", "target_in_pct"):
#         if field in params:
#             try:
#                 val = float(params[field])
#                 if 0 < val <= 100:
#                     clean[field] = round(val, 2)
#             except (ValueError, TypeError):
#                 pass

#     if "quantity" in params:
#         try:
#             val = int(params["quantity"])
#             if 1 <= val <= 1000:
#                 clean["quantity"] = val
#         except (ValueError, TypeError):
#             pass

#     for field in ("entry_start_time", "entry_end_time", "exit_time"):
#         if isinstance(params.get(field), str) and re.match(r"^\d{2}:\d{2}$", params[field]):
#             clean[field] = params[field]

#     return clean if clean else None


# def build_context_block(form: dict, results_summary: dict, saved_strategies: list) -> str:
#     lines = []
#     if form:
#         lines.append("=== CURRENT STRATEGY ===")
#         lines.append(f"Index: {form.get('index')}  Interval: {form.get('interval')}")
#         lines.append(f"Dates: {form.get('start_date')} to {form.get('end_date')}")
#         lines.append(f"Entry: {form.get('entry_start_time')} to {form.get('entry_end_time')}  Exit: {form.get('exit_time')}")
#         lines.append(f"Strike: {form.get('strike_criteria','ATM')}  SL: {form.get('stop_loss_in_pct')}%  Target: {form.get('target_in_pct')}%  Lots: {form.get('quantity')}")
#         inds = form.get("indicators") or []
#         lines.append(f"Indicators: {', '.join(inds) if inds else 'None'}")

#     if results_summary:
#         r = results_summary
#         lines.append("=== CURRENT BACKTEST RESULTS ===")
#         lines.append(f"Trades: {r.get('total_trades')}  Win: {r.get('win_trades')}  Loss: {r.get('loss_trades')}  WinRate: {r.get('win_rate')}%")
#         lines.append(f"PnL: Rs.{r.get('total_pnl')}  Profit: Rs.{r.get('gross_profit')}  Loss: Rs.{r.get('gross_loss')}")
#         lines.append(f"Profit Factor: {r.get('profit_factor')}  Max Drawdown: Rs.{r.get('max_drawdown')}")
#         for t in (r.get("sample_trades") or []):
#             lines.append(f"  {t.get('Date')} {t.get('Symbol')} {t.get('Entry_Time')}-{t.get('Exit_Time')} PnL:Rs.{t.get('Profit_n_Loss')} {t.get('Exit_Reason')}")

#     if saved_strategies:
#         lines.append("=== SAVED STRATEGIES ===")
#         for s in saved_strategies:
#             name = s.get("name", "Unnamed")
#             f    = s.get("formData") or {}
#             inds = f.get("indicators") or []
#             lines.append(
#                 f'Strategy "{name}": Index={f.get("index")} Interval={f.get("interval")} '
#                 f'Dates={f.get("start_date")}-{f.get("end_date")} '
#                 f'Entry={f.get("entry_start_time")}-{f.get("entry_end_time")} Exit={f.get("exit_time")} '
#                 f'Strike={f.get("strike_criteria","ATM")} SL={f.get("stop_loss_in_pct")}% '
#                 f'Target={f.get("target_in_pct")}% Lots={f.get("quantity")} '
#                 f'Indicators={", ".join(inds) if inds else "None"}'
#             )
#     return "\n".join(lines)


# def call_groq(system: str, messages: list) -> dict:
#     groq_msgs = [{"role": "system", "content": system}]
#     for msg in messages:
#         role    = msg.get("role")
#         content = msg.get("content", "").strip()
#         if role in ("user", "assistant") and content:
#             groq_msgs.append({"role": role, "content": content})

#     completion = client.chat.completions.create(
#         model="llama-3.3-70b-versatile",
#         messages=groq_msgs,
#         temperature=0.5,
#         max_tokens=700,
#     )
#     choice = completion.choices[0]
#     raw    = (choice.message.content or "").strip()
#     if choice.finish_reason == "length":
#         print(f"[Chatbot WARN] Truncated: {raw[:150]}")
#     if not raw:
#         return {"reply": "I received an empty response. Please try again.", "suggested_params": None}
#     parsed = extract_json(raw)
#     return {
#         "reply":            (parsed.get("reply") or "").strip() or raw[:400],
#         "suggested_params": parsed.get("suggested_params"),
#     }


# def handle_groq_error(e: Exception) -> dict:
#     if isinstance(e, RateLimitError):
#         return {"reply": "Rate-limited. Please wait a few seconds and try again.", "suggested_params": None}
#     if isinstance(e, APITimeoutError):
#         return {"reply": "Request timed out. Please try again.", "suggested_params": None}
#     if isinstance(e, APIConnectionError):
#         return {"reply": "Could not reach the AI server. Check your connection.", "suggested_params": None}
#     if isinstance(e, APIStatusError):
#         if e.status_code == 400:
#             return {"reply": "Conversation too long — please clear the chat and try again.", "suggested_params": None}
#         if e.status_code == 401:
#             return {"reply": "Invalid GROQ_API_KEY. Check your .env file.", "suggested_params": None}
#         return {"reply": f"AI error (HTTP {e.status_code}). Please try again.", "suggested_params": None}
#     print(f"[Chatbot] Unexpected: {type(e).__name__}: {e}")
#     return {"reply": "Unexpected error. Check server logs.", "suggested_params": None}


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

#     try:
#         result      = call_groq(system_text, messages)
#         raw_params  = result.get("suggested_params")
#         # ← Use validate_params (NOT sanitize/merge) so only AI's changes are returned
#         clean_params = validate_params(raw_params) if raw_params else None
#         return jsonify({"reply": result["reply"], "suggested_params": clean_params})
#     except Exception as e:
#         return jsonify(handle_groq_error(e))


# @chatbot_bp.route("/chatbot/analyze", methods=["POST"])
# @jwt_required()
# def analyze_results():
#     data             = request.get_json(force=True, silent=True) or {}
#     current_form     = data.get("form") or {}
#     results_summary  = data.get("results_summary") or {}
#     saved_strategies = data.get("saved_strategies") or []

#     if not results_summary:
#         return jsonify({"reply": "No results to analyze.", "suggested_params": None})

#     ctx_block   = build_context_block(current_form, results_summary, saved_strategies)
#     system_text = ANALYSIS_PROMPT + (f"\n\n{ctx_block}" if ctx_block else "")
#     analysis_msgs = [{"role": "user", "content": "Please analyze these backtest results and suggest improvements."}]

#     try:
#         result      = call_groq(system_text, analysis_msgs)
#         raw_params  = result.get("suggested_params")
#         # ← Only the changed fields, not the full merged form
#         clean_params = validate_params(raw_params) if raw_params else None
#         return jsonify({"reply": result["reply"], "suggested_params": clean_params})
#     except Exception as e:
#         return jsonify(handle_groq_error(e))


"""
LLM / chatbot.py — All premium-related bugs fixed.

BUGS FIXED:
  1. Case mismatch: BacktestForm saves strike_criteria="premium" (lowercase).
     app.py checks == "premium" (lowercase). But validate_params was only
     accepting "Premium" (capital). Fixed: VALID_CRITERIA uses lowercase
     "premium" to match what app.py expects, and the system prompt example
     also uses lowercase "premium".

  2. Missing premium field: When strike_criteria is "premium", app.py also
     needs the "premium" integer field (e.g. 250). validate_params never
     passed it through. Fixed: premium is now validated and included.

  3. build_context_block didn't include the premium value for saved strategies,
     so the AI couldn't copy it into suggested_params. Fixed.

  4. Spurious run/suggest card on "tell me about" queries: the AI was returning
     suggested_params even for informational replies. Fixed by clarifying in
     RULE 2 that suggested_params is ONLY set for actual run/execute intent,
     not for describe/tell me about queries.
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
# ← lowercase "premium" matches BacktestForm.js and app.py exactly
VALID_CRITERIA   = ["ATM", "premium"]
VALID_INDICATORS = ["rsi", "bullish_n_bearish_engulfing"]
MAX_HISTORY_TURNS = 12

# ── System Prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert trading strategy assistant inside a professional options backtesting platform (NIFTY, BANKNIFTY, MCX).

PERSONALITY:
- Expert but plain-spoken
- Always end with one clear next step
- NEVER fabricate or guess numbers — only use real data from context

━━━ CRITICAL RULES ━━━

RULE 1 — NEVER FAKE RESULTS:
You do NOT run backtests. NEVER invent Win rate, PnL, profit factor, drawdown, or trade counts.

RULE 2 — "RUN" INTENT → suggested_params with ALL strategy fields:
ONLY when user explicitly says "run", "execute", "backtest", "test this", "launch":
  a) Set suggested_params to ALL parameters of the target strategy
  b) Reply: "Here are the parameters. Click Run Backtest to execute."
  c) Do NOT set suggested_params for "tell me about", "describe", "what is", "show me" queries
  d) Informational queries → reply only, suggested_params = null

RULE 3 — OPTIMIZATION SUGGESTION → suggested_params with ONLY CHANGED FIELDS:
When suggesting improvements after analysis:
  a) Set suggested_params to ONLY the fields you want to change
  b) Example: {"stop_loss_in_pct": 5} — not the full form

RULE 4 — "YES/CONFIRM" AFTER ANALYSIS:
Return suggested_params with ONLY the changed fields previously recommended.

━━━ suggested_params schema ━━━
For RUN intent — ALL fields required:
  start_date, end_date : integer YYMMDD (e.g. 220101)
  index                : "NIFTY" | "BANKNIFTY" | "MCX"
  interval             : "1min" | "3min" | "5min" | "15min"
  entry_start_time, entry_end_time, exit_time : "HH:MM"
  strike_criteria      : "ATM" | "premium"   ← always lowercase "premium"
  premium              : integer (REQUIRED when strike_criteria is "premium", e.g. 250)
  stop_loss_in_pct     : number 1-100
  target_in_pct        : number 1-100
  quantity             : integer 1-100
  indicators           : array of "rsi" | "bullish_n_bearish_engulfing"

IMPORTANT: When strike_criteria is "premium", you MUST also include the premium integer value.
Example: "strike_criteria": "premium", "premium": 250

For OPTIMIZATION — include ONLY changed fields.

━━━ OUTPUT FORMAT ━━━
Always respond ONLY with valid JSON — no text outside it:
{"reply": "plain text string", "suggested_params": {...} or null}

━━━ REPLY FORMATTING ━━━
- Use "• item" bullet lines separated by \\n
- Wrap key terms/numbers in **double asterisks** for bold
- Structure: intro line → \\n\\n → bullets → \\n\\n → closing line
- Max 200 words. Use Rs. for rupees.
- No markdown headers, no dashes as bullets, no code fences in reply

━━━ EXAMPLES ━━━

"Tell me about Premium strategy" (informational — NO suggested_params):
{"reply": "Your **Premium** strategy uses NIFTY with 15min interval...\\n\\n• Strike: premium at 250\\n• SL: 6%, Target: 36%\\n\\nWould you like to run it?", "suggested_params": null}

"Run Premium strategy" (run intent — ALL params including premium):
{"reply": "Here are the **Premium** strategy parameters. Click **Run Backtest** to execute.", "suggested_params": {"index": "NIFTY", "interval": "15min", "start_date": 220101, "end_date": 220131, "entry_start_time": "09:15", "entry_end_time": "10:15", "exit_time": "10:15", "strike_criteria": "premium", "premium": 250, "stop_loss_in_pct": 6, "target_in_pct": 36, "quantity": 10, "indicators": ["bullish_n_bearish_engulfing"]}}

"Run ATM strategy" (ATM has no premium field):
{"reply": "Here are the **ATM** strategy parameters.", "suggested_params": {"index": "BANKNIFTY", "interval": "1min", "start_date": 220101, "end_date": 220131, "entry_start_time": "09:15", "entry_end_time": "10:15", "exit_time": "11:00", "strike_criteria": "ATM", "stop_loss_in_pct": 10, "target_in_pct": 20, "quantity": 10, "indicators": ["rsi"]}}

Optimization only (changed fields only):
{"reply": "Reduce **SL to 5%** to limit losses.", "suggested_params": {"stop_loss_in_pct": 5}}
"""

# ── Analysis prompt ────────────────────────────────────────────────────────────
ANALYSIS_PROMPT = """You are an expert trading strategy assistant. Real backtest results have just been returned.

Analyze the results honestly. Do NOT suggest running a backtest — it just ran.

1. Comment on Win Rate, Total PnL, Profit Factor, Max Drawdown using the REAL numbers
2. Identify 2-3 specific weaknesses or strengths
3. End with a concrete optimization suggestion

IMPORTANT FOR suggested_params:
- Return ONLY the fields you want to change, not the full strategy
- If strike_criteria should change to "premium", also include the premium value
- If no specific change, return null

Output: only valid JSON:
{"reply": "...", "suggested_params": {ONLY changed fields} or null}

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


def validate_params(params: dict) -> dict | None:
    """
    Validate AI suggested_params. Returns only the validated fields present in params.
    Does NOT merge onto current form — frontend does that before calling /backtest.
    """
    if not params or not isinstance(params, dict):
        return None

    clean = {}

    if params.get("index") in VALID_INDICES:
        clean["index"] = params["index"]
    if params.get("interval") in VALID_INTERVALS:
        clean["interval"] = params["interval"]

    # ← Accept both cases, normalize to lowercase to match app.py
    sc = params.get("strike_criteria", "")
    if isinstance(sc, str):
        sc_lower = sc.lower()
        if sc_lower == "atm":
            clean["strike_criteria"] = "ATM"
        elif sc_lower == "premium":
            clean["strike_criteria"] = "premium"

    # ← Pass through premium value (required when strike_criteria is "premium")
    if "premium" in params:
        try:
            val = int(params["premium"])
            if val > 0:
                clean["premium"] = val
        except (ValueError, TypeError):
            pass

    if isinstance(params.get("indicators"), list):
        valid_inds = [i for i in params["indicators"] if i in VALID_INDICATORS]
        clean["indicators"] = valid_inds

    for field in ("start_date", "end_date"):
        if field in params:
            try:
                clean[field] = int(params[field])
            except (ValueError, TypeError):
                pass

    for field in ("stop_loss_in_pct", "target_in_pct"):
        if field in params:
            try:
                val = float(params[field])
                if 0 < val <= 100:
                    clean[field] = round(val, 2)
            except (ValueError, TypeError):
                pass

    if "quantity" in params:
        try:
            val = int(params["quantity"])
            if 1 <= val <= 1000:
                clean["quantity"] = val
        except (ValueError, TypeError):
            pass

    for field in ("entry_start_time", "entry_end_time", "exit_time"):
        if isinstance(params.get(field), str) and re.match(r"^\d{2}:\d{2}$", params[field]):
            clean[field] = params[field]

    return clean if clean else None


def build_context_block(form: dict, results_summary: dict, saved_strategies: list) -> str:
    lines = []
    if form:
        lines.append("=== CURRENT STRATEGY ===")
        lines.append(f"Index: {form.get('index')}  Interval: {form.get('interval')}")
        lines.append(f"Dates: {form.get('start_date')} to {form.get('end_date')}")
        lines.append(f"Entry: {form.get('entry_start_time')} to {form.get('entry_end_time')}  Exit: {form.get('exit_time')}")
        strike = form.get('strike_criteria', 'ATM')
        premium_val = form.get('premium')
        # ← Include premium value in context so AI can copy it into suggested_params
        if strike.lower() == "premium" and premium_val:
            lines.append(f"Strike: {strike} (premium={premium_val})  SL: {form.get('stop_loss_in_pct')}%  Target: {form.get('target_in_pct')}%  Lots: {form.get('quantity')}")
        else:
            lines.append(f"Strike: {strike}  SL: {form.get('stop_loss_in_pct')}%  Target: {form.get('target_in_pct')}%  Lots: {form.get('quantity')}")
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
            strike = f.get("strike_criteria", "ATM")
            premium_val = f.get("premium")
            # ← Include premium value in saved strategy context
            strike_str = f"{strike} (premium={premium_val})" if str(strike).lower() == "premium" and premium_val else strike
            lines.append(
                f'Strategy "{name}": Index={f.get("index")} Interval={f.get("interval")} '
                f'Dates={f.get("start_date")}-{f.get("end_date")} '
                f'Entry={f.get("entry_start_time")}-{f.get("entry_end_time")} Exit={f.get("exit_time")} '
                f'Strike={strike_str} SL={f.get("stop_loss_in_pct")}% '
                f'Target={f.get("target_in_pct")}% Lots={f.get("quantity")} '
                f'Indicators={", ".join(inds) if inds else "None"}'
            )
    return "\n".join(lines)


def call_groq(system: str, messages: list) -> dict:
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
        clean_params = validate_params(raw_params) if raw_params else None
        return jsonify({"reply": result["reply"], "suggested_params": clean_params})
    except Exception as e:
        return jsonify(handle_groq_error(e))


@chatbot_bp.route("/chatbot/analyze", methods=["POST"])
@jwt_required()
def analyze_results():
    data             = request.get_json(force=True, silent=True) or {}
    current_form     = data.get("form") or {}
    results_summary  = data.get("results_summary") or {}
    saved_strategies = data.get("saved_strategies") or []

    if not results_summary:
        return jsonify({"reply": "No results to analyze.", "suggested_params": None})

    ctx_block     = build_context_block(current_form, results_summary, saved_strategies)
    system_text   = ANALYSIS_PROMPT + (f"\n\n{ctx_block}" if ctx_block else "")
    analysis_msgs = [{"role": "user", "content": "Please analyze these backtest results and suggest improvements."}]

    try:
        result       = call_groq(system_text, analysis_msgs)
        raw_params   = result.get("suggested_params")
        clean_params = validate_params(raw_params) if raw_params else None
        return jsonify({"reply": result["reply"], "suggested_params": clean_params})
    except Exception as e:
        return jsonify(handle_groq_error(e))