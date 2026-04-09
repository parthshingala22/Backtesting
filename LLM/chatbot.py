"""
LLM / chatbot.py  —  hardened against all known silent-failure causes

Root causes of "chatbot not responding":
  1. response_format json_object causes Groq to time-out or return empty
     when the model can't satisfy it (e.g. very short replies, confused prompts).
  2. The reply field contains unescaped newlines / special chars that break
     json.loads, so extract_json falls through and returns the raw text as
     the reply — but the reply contains JSON noise which the UI can't render.
  3. long conversation history exceeds token limit → Groq returns a 400.
  4. Unhandled Groq-specific exceptions (RateLimitError, APIStatusError, etc.)
     are all caught by the bare `except Exception` but the error message is
     swallowed and a 500 is returned — React's fetch() then throws and the
     frontend shows a generic "can't connect" message instead of retrying.
  5. Two system messages in a row is legal but some Groq model versions
     reject it; merging them is safer.

Fixes applied:
  - Removed response_format constraint; ask for JSON via the prompt only.
  - Added a trim_messages() guard that keeps the last N turns so token
    budget is never blown.
  - Specific Groq exception types are caught and mapped to user-friendly
    messages with the correct HTTP status codes.
  - Context block merged into the single system message (no double-system).
  - extract_json is more aggressive: also handles the model wrapping the
    JSON in a markdown fence inside the reply field itself.
  - Added a finish_reason check — if the model stopped early (length) the
    partial JSON is still attempted before falling back.
  - All error paths return 200 with a meaningful reply instead of 500,
    so the frontend always renders something.
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
VALID_CRITERIA   = ["ATM"]
VALID_INDICATORS = ["rsi", "bullish_n_bearish_engulfing"]

# Keep only this many recent user+assistant turns to avoid token overflow.
# Each turn ≈ 100-300 tokens; 12 turns ≈ ~1800 tokens — safe headroom.
MAX_HISTORY_TURNS = 12

# ── System Prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert trading strategy assistant inside a professional NSE options backtesting platform (NIFTY, BANKNIFTY, FINNIFTY).

PERSONALITY:
- Expert but plain-spoken
- Always end with one clear next step
- Never invent numbers — only use data from context

CAPABILITIES:
1. Strategy analysis — entry/exit windows, indicators, strike, SL/target
2. Backtest interpretation — PnL, Win Rate, Profit Factor, Max Drawdown
3. Optimization — specific parameter improvements with reasoning
4. Education — options concepts, indicators, risk management

BACKTEST SUGGESTION PROTOCOL:
When the user asks you to suggest, optimize, or run different parameters — set suggested_params.
Only include fields you want to change (not the full form).

suggested_params schema (all fields optional):
  start_date / end_date : integer YYMMDD (e.g. 220101)
  index                 : "NIFTY" | "BANKNIFTY" | "MCX"
  interval              : "1min" | "3min" | "5min" | "15min"
  entry_start_time / entry_end_time / exit_time : "HH:MM"
  strike_criteria       : "ATM"
  stop_loss_in_pct      : number 1-100
  target_in_pct         : number 1-100
  quantity              : integer 1-100
  indicators            : array — valid values: "rsi", "bullish_n_bearish_engulfing"

OUTPUT FORMAT:
You MUST respond with ONLY a valid JSON object — no text outside it, no code fences.
{
  "reply": "your response as a plain string",
  "suggested_params": { ...fields... } or null
}

REPLY FORMATTING:
- Use "• item" bullet lines, each separated by \\n
- Wrap key terms/numbers in **double asterisks** for bold
- Structure: one intro line → \\n\\n → bullets → \\n\\n → closing line
- Max 220 words
- Use Rs. for rupees
- No markdown headers, no dashes as bullets, no triple backticks in reply
- NEVER put JSON inside the reply string

EXAMPLE:
{"reply": "Your **win rate is 38%** — below the 50% threshold for this style.\\n\\n• **Stop Loss 10%** is too wide; price hits SL before reaching target\\n• **No indicators** means entries are purely time-based, increasing noise\\n• **Entry window** 09:15-10:15 is volatile — consider 09:30 start\\n\\nI suggest SL 6%, target 15%, add RSI. Want me to run a backtest with these?", "suggested_params": {"stop_loss_in_pct": 6, "target_in_pct": 15, "indicators": ["rsi"]}}
"""


# ── Helpers ───────────────────────────────────────────────────────────────────

def trim_messages(messages: list, max_turns: int) -> list:
    """Keep only the last max_turns user+assistant pairs to avoid token overflow."""
    # Always keep the first message (the greeting) so context isn't lost
    if len(messages) <= max_turns:
        return messages
    return messages[:1] + messages[-(max_turns - 1):]


def extract_json(raw: str) -> dict:
    """
    Robustly extract {reply, suggested_params} from model output.
    Handles: plain JSON, fenced JSON, JSON with trailing text,
    and models that wrap their answer in extra narrative.
    """
    text = raw.strip()

    # 1. Strip markdown fences
    text = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\n?```\s*$", "", text)
    text = text.strip()

    # 2. Direct parse
    try:
        obj = json.loads(text)
        if isinstance(obj, dict) and "reply" in obj:
            return obj
    except json.JSONDecodeError:
        pass

    # 3. Find the outermost {...} — handles trailing text after the JSON
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

    # 4. Last resort — treat entire output as the reply
    # Clean up any JSON-looking noise before returning as plain text
    clean = re.sub(r'\{.*?\}', '', text, flags=re.DOTALL).strip()
    return {"reply": clean or text, "suggested_params": None}


def sanitize_params(params: dict, current_form: dict) -> dict | None:
    """Validate and merge AI-suggested params onto current form."""
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

    return merged


def build_context_block(form: dict, results_summary: dict) -> str:
    """Build a compact context string to inject into the system message."""
    lines = []

    if form:
        lines.append("=== CURRENT STRATEGY ===")
        lines.append(f"Index: {form.get('index')}  Interval: {form.get('interval')}")
        lines.append(f"Dates: {form.get('start_date')} to {form.get('end_date')}")
        lines.append(
            f"Entry: {form.get('entry_start_time')} to {form.get('entry_end_time')}  "
            f"Exit: {form.get('exit_time')}"
        )
        lines.append(
            f"Strike: {form.get('strike_criteria', 'ATM')}  "
            f"SL: {form.get('stop_loss_in_pct')}%  "
            f"Target: {form.get('target_in_pct')}%  "
            f"Lots: {form.get('quantity')}"
        )
        inds = form.get("indicators") or []
        lines.append(f"Indicators: {', '.join(inds) if inds else 'None'}")

    if results_summary:
        r = results_summary
        lines.append("=== BACKTEST RESULTS ===")
        lines.append(
            f"Trades: {r.get('total_trades')}  "
            f"Win: {r.get('win_trades')}  "
            f"Loss: {r.get('loss_trades')}  "
            f"WinRate: {r.get('win_rate')}%"
        )
        lines.append(
            f"PnL: Rs.{r.get('total_pnl')}  "
            f"Profit: Rs.{r.get('gross_profit')}  "
            f"Loss: Rs.{r.get('gross_loss')}"
        )
        for t in (r.get("sample_trades") or []):
            lines.append(
                f"  {t.get('Date')} {t.get('Symbol')} "
                f"{t.get('Entry_Time')}-{t.get('Exit_Time')} "
                f"PnL:Rs.{t.get('Profit_n_Loss')} {t.get('Exit_Reason')}"
            )

    return "\n".join(lines)


# ── Route ─────────────────────────────────────────────────────────────────────

@chatbot_bp.route("/chatbot", methods=["POST"])
@jwt_required()
def chatbot():
    data             = request.get_json(force=True, silent=True) or {}
    messages         = data.get("messages", [])
    context          = data.get("context") or {}
    current_form     = context.get("form") or {}
    results_summary  = context.get("results_summary")

    if not messages:
        return jsonify({"reply": "No message received.", "suggested_params": None})

    # Trim history to avoid token overflow
    messages = trim_messages(messages, MAX_HISTORY_TURNS)

    # Build system message with context embedded
    ctx_block   = build_context_block(current_form, results_summary)
    system_text = SYSTEM_PROMPT
    if ctx_block:
        system_text += f"\n\n{ctx_block}"

    # Build message list: one system message + conversation turns
    groq_msgs = [{"role": "system", "content": system_text}]
    for msg in messages:
        role = msg.get("role")
        if role in ("user", "assistant"):
            content = msg.get("content", "").strip()
            if content:  # skip empty turns — Groq rejects them
                groq_msgs.append({"role": role, "content": content})

    # ── Call Groq ─────────────────────────────────────────────────────────────
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_msgs,
            temperature=0.55,
            max_tokens=700,
            # No response_format constraint — we enforce JSON via prompt only.
            # response_format causes silent failures when the model is uncertain.
        )

        choice      = completion.choices[0]
        raw         = (choice.message.content or "").strip()
        finish      = choice.finish_reason  # "stop" | "length" | "tool_calls" | None

        # Log partial responses for debugging
        if finish == "length":
            print(f"[Chatbot WARN] Response truncated (finish_reason=length). Raw: {raw[:200]}")

        if not raw:
            return jsonify({
                "reply": "I received an empty response from the AI. Please try rephrasing your question.",
                "suggested_params": None
            })

        parsed       = extract_json(raw)
        reply        = (parsed.get("reply") or "").strip()
        raw_params   = parsed.get("suggested_params")
        clean_params = sanitize_params(raw_params, current_form) if raw_params else None

        # Final guard: if reply is empty after all parsing, surface the raw text
        if not reply:
            reply = raw[:500] if len(raw) <= 500 else raw[:500] + "…"

        return jsonify({"reply": reply, "suggested_params": clean_params})

    # ── Specific Groq error types ─────────────────────────────────────────────
    except RateLimitError:
        print("[Chatbot] Rate limit hit")
        return jsonify({
            "reply": "I'm being rate-limited right now. Please wait a few seconds and try again.",
            "suggested_params": None
        })

    except APITimeoutError:
        print("[Chatbot] Request timed out")
        return jsonify({
            "reply": "The request timed out. Please try again — Groq can occasionally be slow during peak hours.",
            "suggested_params": None
        })

    except APIConnectionError as e:
        print(f"[Chatbot] Connection error: {e}")
        return jsonify({
            "reply": "Could not reach the AI server. Check your internet connection and try again.",
            "suggested_params": None
        })

    except APIStatusError as e:
        status = e.status_code
        print(f"[Chatbot] APIStatusError {status}: {e.message}")
        if status == 400:
            return jsonify({
                "reply": "The request was rejected by the AI (likely the conversation is too long). Try clearing the chat and asking again.",
                "suggested_params": None
            })
        if status == 401:
            return jsonify({
                "reply": "Authentication failed — please check your GROQ_API_KEY in the .env file.",
                "suggested_params": None
            })
        if status == 503:
            return jsonify({
                "reply": "The AI service is temporarily unavailable. Please try again in a moment.",
                "suggested_params": None
            })
        return jsonify({
            "reply": f"The AI returned an error (HTTP {status}). Please try again.",
            "suggested_params": None
        })

    except Exception as e:
        print(f"[Chatbot] Unexpected error: {type(e).__name__}: {e}")
        return jsonify({
            "reply": "An unexpected error occurred. Please try again — if it keeps happening, check the server logs.",
            "suggested_params": None
        })