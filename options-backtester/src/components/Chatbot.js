import React, { useState, useRef, useEffect } from "react";
import "./Chatbot.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// ── Constants ─────────────────────────────────────────────────────────────────
const FIELD_LABELS = {
  index: "Index", interval: "Interval",
  start_date: "Start Date", end_date: "End Date",
  entry_start_time: "Entry Start", entry_end_time: "Entry End",
  exit_time: "Exit Time", strike_criteria: "Strike",
  stop_loss_in_pct: "Stop Loss", target_in_pct: "Target",
  quantity: "Lots", indicators: "Indicators",
};





function fmtVal(key, val) {
  if (key === "stop_loss_in_pct" || key === "target_in_pct") return `${val}%`;
  if (key === "indicators") return Array.isArray(val) && val.length ? val.join(", ") : "None";
  if (key === "start_date" || key === "end_date") {
    const s = String(val);
    return `20${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  }
  return String(val);
}

// ── Rich text renderer ────────────────────────────────────────────────────────
function RichText({ content }) {
  const renderLine = (line, idx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const nodes = parts.map((p, pi) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={pi}>{p.slice(2, -2)}</strong>
        : <span key={pi}>{p}</span>
    );
    if (line.trimStart().startsWith("•") || line.trimStart().startsWith("-"))
      return (
        <div key={idx} className="chat-bullet-line">
          <span className="chat-bullet-dot">•</span><span>{nodes}</span>
        </div>
      );
    if (line.trim() === "") return <div key={idx} className="chat-line-gap" />;
    return <div key={idx} className="chat-text-line">{nodes}</div>;
  };
  return <div className="chat-rich-text">{content.split("\n").map(renderLine)}</div>;
}

// ── Run card — shows all params before the real backtest runs ─────────────────
function RunCard({ params, onRun, onDecline, answered, running }) {
  const entries = Object.entries(params).filter(([k]) => FIELD_LABELS[k]);
  return (
    <div className={`run-card ${answered ? "answered" : ""}`}>
      <div className="run-card-header">
        <span>🚀</span>
        <span className="run-card-title">Ready to Run Backtest</span>
      </div>
      <div className="run-card-params">
        {entries.map(([key, val]) => (
          <div className="run-card-row" key={key}>
            <span className="run-card-label">{FIELD_LABELS[key]}</span>
            <span className="run-card-value">{fmtVal(key, val)}</span>
          </div>
        ))}
      </div>
      {!answered && (
        <div className="run-card-actions">
          <button className="run-card-yes" onClick={onRun} disabled={running}>
            {running ? "Running…" : "🚀 Run Backtest"}
          </button>
          <button className="run-card-no" onClick={onDecline} disabled={running}>✕ Cancel</button>
        </div>
      )}
      {answered === "run" && <div className="run-card-status running-status">🚀 Backtest running…</div>}
      {answered === "complete" && <div className="run-card-status complete-status">✓ Complete — see results below</div>}
      {answered === "declined" && <div className="run-card-status declined-status">✕ Cancelled</div>}
    </div>
  );
}

// ── Suggestion card — for optimization after results ─────────────────────────
function SuggestionCard({ params, currentForm, onConfirm, onDecline, answered, running }) {
  const changedEntries = Object.entries(params).filter(([key, val]) => {
    if (!currentForm) return true;
    const cur = currentForm[key];
    if (key === "indicators") return JSON.stringify(cur) !== JSON.stringify(val);
    return String(cur) !== String(val);
  });
  return (
    <div className={`suggestion-card ${answered ? "answered" : ""}`}>
      <div className="suggestion-card-header">
        <span>⚡</span>
        <span className="suggestion-title">Optimized Parameters</span>
      </div>
      <div className="suggestion-params">
        {changedEntries.length === 0
          ? <div className="suggestion-param-row"><span className="suggestion-param-label">Config</span><span className="suggestion-param-new">Same as current</span></div>
          : changedEntries.map(([key, val]) => (
            <div className="suggestion-param-row" key={key}>
              <span className="suggestion-param-label">{FIELD_LABELS[key] || key}</span>
              <span className="suggestion-param-value">
                {currentForm?.[key] !== undefined && (
                  <span className="suggestion-param-old">{fmtVal(key, currentForm[key])}</span>
                )}
                <span className="suggestion-param-arrow">→</span>
                <span className="suggestion-param-new">{fmtVal(key, val)}</span>
              </span>
            </div>
          ))
        }
      </div>
      {!answered && (
        <div className="suggestion-actions">
          <button className="suggestion-yes-btn" onClick={onConfirm} disabled={running}>
            {running ? "Running…" : "✓ Run Backtest"}
          </button>
          <button className="suggestion-no-btn" onClick={onDecline} disabled={running}>✕ Skip</button>
        </div>
      )}
      {answered === "confirmed" && <div className="suggestion-answered confirmed">✓ Backtest complete — see results below</div>}
      {answered === "declined" && <div className="suggestion-answered declined">✕ Skipped</div>}
    </div>
  );
}

// ── Inline backtest result card ───────────────────────────────────────────────
function InlineReport({ results }) {
  const wins = results.filter(t => t.Profit_n_Loss > 0);
  const losses = results.filter(t => t.Profit_n_Loss <= 0);
  const totalPnL = results.reduce((s, t) => s + t.Profit_n_Loss, 0);
  const winRate = results.length ? ((wins.length / results.length) * 100).toFixed(1) : 0;
  const grossProfit = wins.reduce((s, t) => s + t.Profit_n_Loss, 0);
  const grossLoss = losses.reduce((s, t) => s + Math.abs(t.Profit_n_Loss), 0);
  const profitFactor = grossLoss ? (grossProfit / grossLoss).toFixed(2) : "∞";
  let eq = 0, peak = 0, maxDD = 0;
  const curve = results.map(t => {
    eq += t.Profit_n_Loss;
    if (eq > peak) peak = eq;
    const dd = peak - eq;
    if (dd > maxDD) maxDD = dd;
    return eq;
  });
  const chartData = {
    labels: results.map((_, i) => i + 1),
    datasets: [{
      data: curve,
      borderColor: totalPnL >= 0 ? "#10b981" : "#ef4444",
      backgroundColor: totalPnL >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
      borderWidth: 1.5, pointRadius: 0, tension: 0.3, fill: true,
    }],
  };
  const stats = [
    { label: "Total PnL", value: `₹${totalPnL.toFixed(2)}`, color: totalPnL >= 0 ? "#10b981" : "#ef4444" },
    { label: "Trades", value: results.length },
    { label: "Win Rate", value: `${winRate}%`, color: Number(winRate) >= 50 ? "#10b981" : "#ef4444" },
    { label: "Profit Factor", value: profitFactor },
    { label: "Max Drawdown", value: `₹${maxDD.toFixed(0)}`, color: "#ef4444" },
  ];
  return (
    <div className="inline-report">
      <div className="inline-report-header">📊 Backtest Result</div>
      <div className="inline-report-stats">
        {stats.map(s => (
          <div key={s.label} className="inline-stat">
            <div className="inline-stat-label">{s.label}</div>
            <div className="inline-stat-value" style={{ color: s.color || "#1a1f36" }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="inline-report-chart">
        <Line data={chartData} options={{
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
        }} />
      </div>
      <div className="inline-report-note">
        {wins.length}W / {losses.length}L · Profit ₹{grossProfit.toFixed(0)} · Loss ₹{grossLoss.toFixed(0)}
      </div>
    </div>
  );
}

// ── Save strategy card ────────────────────────────────────────────────────────
function SaveStrategyCard({ onSave, onSkip, status }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const handleSave = () => {
    if (!name.trim()) { setError("Please enter a strategy name"); return; }
    onSave(name.trim());
  };
  if (status === "saved") return <div className="save-card saved"><span>✓</span><span>Strategy saved to <strong>My Strategies</strong></span></div>;
  if (status === "skipped") return <div className="save-card skipped"><span>✕</span><span>Not saved</span></div>;
  return (
    <div className="save-card">
      <div className="save-card-header"><span>💾</span><span className="save-card-title">Save this strategy?</span></div>
      <div className="save-card-body">
        <input
          className="save-card-input"
          placeholder="Enter strategy name…"
          value={name}
          onChange={e => { setName(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          maxLength={60}
          autoFocus
        />
        {error && <div className="save-card-error">{error}</div>}
      </div>
      <div className="save-card-actions">
        <button className="save-card-yes" onClick={handleSave}>💾 Save</button>
        <button className="save-card-no" onClick={onSkip}>✕ Skip</button>
      </div>
    </div>
  );
}

// ── Saved strategies panel ────────────────────────────────────────────────────
function StrategiesPanel({ strategies, loading, onSelect, onClose }) {
  return (
    <div className="strategies-panel">
      <div className="strategies-panel-header">
        <span>📂 My Saved Strategies</span>
        <button className="strategies-panel-close" onClick={onClose}>✕</button>
      </div>
      {loading ? (
        <div className="strategies-panel-empty">Loading…</div>
      ) : strategies.length === 0 ? (
        <div className="strategies-panel-empty">No saved strategies yet.</div>
      ) : (
        <div className="strategies-panel-list">
          {strategies.map(s => (
            <button key={s.id} className="strategy-panel-item" onClick={() => onSelect(s)}>
              <div className="strategy-panel-name">📈 {s.name}</div>
              <div className="strategy-panel-meta">
                {s.formData?.index} · {s.formData?.interval} · SL {s.formData?.stop_loss_in_pct}% · Target {s.formData?.target_in_pct}%
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Build results summary for context ────────────────────────────────────────
function buildResultsSummary(results) {
  if (!results?.length) return null;
  const wins = results.filter(t => t.Profit_n_Loss > 0);
  const losses = results.filter(t => t.Profit_n_Loss <= 0);
  const grossProfit = wins.reduce((s, t) => s + t.Profit_n_Loss, 0);
  const grossLoss = losses.reduce((s, t) => s + Math.abs(t.Profit_n_Loss), 0);
  let eq = 0, peak = 0, maxDD = 0;
  results.forEach(t => {
    eq += t.Profit_n_Loss;
    if (eq > peak) peak = eq;
    const dd = peak - eq;
    if (dd > maxDD) maxDD = dd;
  });
  return {
    total_trades: results.length,
    win_trades: wins.length,
    loss_trades: losses.length,
    total_pnl: results.reduce((s, t) => s + t.Profit_n_Loss, 0).toFixed(2),
    win_rate: ((wins.length / results.length) * 100).toFixed(2),
    gross_profit: grossProfit.toFixed(2),
    gross_loss: grossLoss.toFixed(2),
    profit_factor: grossLoss ? (grossProfit / grossLoss).toFixed(2) : null,
    max_drawdown: maxDD.toFixed(2),
    sample_trades: results.slice(0, 5),
  };
}

// ── Main Chatbot ──────────────────────────────────────────────────────────────
function Chatbot({ isOpen, onClose, backtestResults, form }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hey! I'm your **trading assistant** 🤖\n\nI can:\n• Analyze your current or saved strategies\n• Run a real backtest and interpret the results\n• Suggest parameter optimizations\n\nWhat would you like to do?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Track card states per message index
  const [runCardState, setRunCardState] = useState({}); // idx → "run"|"complete"|"declined"
  const [suggestionState, setSuggestionState] = useState({}); // idx → "confirmed"|"declined"
  const [saveCardStatus, setSaveCardStatus] = useState({}); // idx → "saved"|"skipped"
  const [runningCard, setRunningCard] = useState(null); // idx currently running

  const [savedStrategies, setSavedStrategies] = useState([]);
  const [strategiesLoading, setStrategiesLoading] = useState(false);
  const [showStrategiesPanel, setShowStrategiesPanel] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const token = sessionStorage.getItem("token");

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    if (isOpen) { setTimeout(() => inputRef.current?.focus(), 120); fetchSavedStrategies(); }
  }, [isOpen]);

  const fetchSavedStrategies = async () => {
    setStrategiesLoading(true);
    try {
      const res = await fetch("http://localhost:5000/strategies", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSavedStrategies(Array.isArray(data) ? data : []);
    } catch { setSavedStrategies([]); }
    finally { setStrategiesLoading(false); }
  };

  // ── Send message to /chatbot ────────────────────────────────────────────────
  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: updatedMsgs,
          context: {
            form: form || null,
            results_summary: buildResultsSummary(backtestResults),
            saved_strategies: savedStrategies,
          },
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply || "Sorry, no response received.",
        suggested_params: data.suggested_params || null,
        card_type: data.suggested_params ? detectCardType(text) : null,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, couldn't connect to the server. Please try again.", suggested_params: null }]);
    } finally {
      setLoading(false);
    }
  };

  // Detect whether this is a "run" intent (shows RunCard) vs optimization (shows SuggestionCard)
  const detectCardType = (userText) => {
    const runKeywords = /\b(run|execute|backtest|test this|start|go|launch)\b/i;
    return runKeywords.test(userText) ? "run" : "suggest";
  };

  // ── Execute actual backtest with given params ───────────────────────────────
  const executeBacktest = async (params, cardMsgIndex, cardType) => {
    setRunningCard(cardMsgIndex);

    // Mark card as "running"
    if (cardType === "run") setRunCardState(prev => ({ ...prev, [cardMsgIndex]: "run" }));
    else setSuggestionState(prev => ({ ...prev, [cardMsgIndex]: "confirmed" }));

    try {
      const payload = { ...params };
      delete payload.strike_mode;

      const res = await fetch("http://localhost:5000/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const results = await res.json();

      // Mark card complete
      if (cardType === "run") setRunCardState(prev => ({ ...prev, [cardMsgIndex]: "complete" }));

      if (!results.length) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Backtest ran but returned **no trades**.\n\n• The date range may have no market data\n• The entry window might be too narrow\n• Indicator filters may be too strict\n\nTry adjusting the date range or relaxing the entry conditions.",
          suggested_params: null,
        }]);
        return;
      }

      // Insert result report message
      const resultMsgIndex = messages.length + 2; // approximate — will be exact via setMessages callback
      let exactResultIndex = -1;

      setMessages(prev => {
        exactResultIndex = prev.length;
        return [...prev, {
          role: "assistant",
          content: "✓ Backtest complete! Here are the results:",
          suggested_params: null,
          inline_results: results,
          show_save_card: true,
          run_params: params,
        }];
      });

      // Auto-call /chatbot/analyze to get real AI analysis + optional suggestions
      await triggerAnalysis(params, results);

    } catch {
      if (cardType === "run") setRunCardState(prev => ({ ...prev, [cardMsgIndex]: "complete" }));
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Backtest failed — the server returned an error. Check your parameters and try again.",
        suggested_params: null,
      }]);
    } finally {
      setRunningCard(null);
    }
  };

  // ── Auto-analyze after real backtest ───────────────────────────────────────
  const triggerAnalysis = async (params, results) => {
    const summary = buildResultsSummary(results);
    try {
      const res = await fetch("http://localhost:5000/chatbot/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          form: params,
          results_summary: summary,
          saved_strategies: savedStrategies,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.reply,
          suggested_params: data.suggested_params || null,
          card_type: data.suggested_params ? "suggest" : null,
        }]);
      }
    } catch {
      // Analysis failing is non-critical — don't show an error
    }
  };

  // ── Card action handlers ────────────────────────────────────────────────────
  const handleRunCard = (msgIndex, params) => {
    executeBacktest(params, msgIndex, "run");
  };

  const handleDeclineRunCard = (msgIndex) => {
    setRunCardState(prev => ({ ...prev, [msgIndex]: "declined" }));
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "Cancelled. Let me know when you'd like to run it.",
      suggested_params: null,
    }]);
  };

  const handleConfirmSuggestion = (msgIndex, params) => {
    executeBacktest(params, msgIndex, "suggest");
  };

  const handleDeclineSuggestion = (msgIndex) => {
    setSuggestionState(prev => ({ ...prev, [msgIndex]: "declined" }));
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "No problem! Let me know if you'd like to try different parameters.",
      suggested_params: null,
    }]);
  };

  // ── Save strategy ───────────────────────────────────────────────────────────
  const handleSaveStrategy = async (msgIndex, strategyName, formData) => {
    try {
      const res = await fetch("http://localhost:5000/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: strategyName, formData }),
      });
      const data = await res.json();
      if (data.success || data.id || res.ok) {
        setSaveCardStatus(prev => ({ ...prev, [msgIndex]: "saved" }));
        fetchSavedStrategies();
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `✓ Strategy **"${strategyName}"** saved to My Strategies!`,
          suggested_params: null,
        }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `Failed to save: ${data.error || "Unknown error"}`, suggested_params: null }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Could not save strategy — server error.", suggested_params: null }]);
    }
  };

  const handleSelectStrategy = (strategy) => {
    setShowStrategiesPanel(false);
    sendMessage(`Tell me about my saved strategy: "${strategy.name}"`);
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: "Chat cleared! Ready to help. What would you like to do?" }]);
    setRunCardState({});
    setSuggestionState({});
    setSaveCardStatus({});
    setRunningCard(null);
  };

  const quickPrompts = [
    "Analyze my current strategy",
    "Run the current strategy",
    "Compare my saved strategies",
    "Run an optimized backtest",
  ];

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="chatbot-window">

        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-left">
            <div className="chatbot-avatar">
              <span>🤖</span>
              <span className="chatbot-status-dot" />
            </div>
            <div>
              <div className="chatbot-title">Trading Assistant</div>
              <div className="chatbot-subtitle">Powered by Groq · Llama 3.3 70B</div>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button className={`chatbot-icon-btn ${showStrategiesPanel ? "active" : ""}`}
              onClick={() => setShowStrategiesPanel(v => !v)} title="My Strategies">📂</button>
            <button className="chatbot-icon-btn" onClick={clearChat} title="Clear">🗑</button>
            <button className="chatbot-icon-btn" onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        {/* Strategies panel */}
        {showStrategiesPanel && (
          <StrategiesPanel
            strategies={savedStrategies}
            loading={strategiesLoading}
            onSelect={handleSelectStrategy}
            onClose={() => setShowStrategiesPanel(false)}
          />
        )}

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className="chatbot-msg-group">

              {/* Bubble */}
              <div className={`chatbot-msg-row ${msg.role}`}>
                {msg.role === "assistant" && <div className="chatbot-msg-avatar">🤖</div>}
                <div className={`chatbot-bubble ${msg.role}`}>
                  <RichText content={msg.content} />
                </div>
                {msg.role === "user" && <div className="chatbot-msg-avatar user-avatar">👤</div>}
              </div>

              {/* RunCard — shown when AI responds with "run" intent */}
              {msg.role === "assistant" && msg.suggested_params && msg.card_type === "run" && (
                <div className="suggestion-card-wrapper">
                  <RunCard
                    params={msg.suggested_params}
                    answered={runCardState[i]}
                    running={runningCard === i}
                    onRun={() => handleRunCard(i, msg.suggested_params)}
                    onDecline={() => handleDeclineRunCard(i)}
                  />
                </div>
              )}

              {/* SuggestionCard — shown when AI responds with optimization */}
              {msg.role === "assistant" && msg.suggested_params && msg.card_type === "suggest" && (
                <div className="suggestion-card-wrapper">
                  <SuggestionCard
                    params={msg.suggested_params}
                    currentForm={form}
                    answered={suggestionState[i]}
                    running={runningCard === i}
                    onConfirm={() => handleConfirmSuggestion(i, msg.suggested_params)}
                    onDecline={() => handleDeclineSuggestion(i)}
                  />
                </div>
              )}

              {/* Inline results */}
              {msg.inline_results && (
                <div className="inline-report-wrapper">
                  <InlineReport results={msg.inline_results} />
                </div>
              )}

              {/* Save card — below result */}
              {msg.show_save_card && (
                <div className="save-card-wrapper">
                  <SaveStrategyCard
                    status={saveCardStatus[i]}
                    onSave={(name) => handleSaveStrategy(i, name, msg.run_params)}
                    onSkip={() => setSaveCardStatus(prev => ({ ...prev, [i]: "skipped" }))}
                  />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chatbot-msg-row assistant">
              <div className="chatbot-msg-avatar">🤖</div>
              <div className="chatbot-bubble assistant chatbot-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {messages.length === 1 && (
          <div className="chatbot-quick-prompts">
            {quickPrompts.map((p, i) => (
              <button key={i} className="chatbot-quick-btn" onClick={() => sendMessage(p)}>{p}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chatbot-input-area">
          <textarea
            ref={inputRef}
            className="chatbot-input"
            placeholder="Ask anything, or say 'run this strategy'…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={1}
          />
          <button
            className={`chatbot-send-btn ${(!input.trim() || loading) ? "disabled" : ""}`}
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            {loading ? "⏳" : "➤"}
          </button>
        </div>
        <div className="chatbot-footer-note">Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  );
}

export default Chatbot;