import React, { useState, useRef, useEffect } from "react";
import "./Chatbot.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// const FIELD_LABELS = {
//   index: "Index", interval: "Interval",
//   start_date: "Start Date", end_date: "End Date",
//   entry_start_time: "Entry Start", entry_end_time: "Entry End",
//   exit_time: "Exit Time", strike_criteria: "Strike",
//   stop_loss_in_pct: "Stop Loss", target_in_pct: "Target",
//   quantity: "Lots", indicators: "Indicators",
// };
const FIELD_LABELS = {
  index: "Index", interval: "Interval",
  start_date: "Start Date", end_date: "End Date",
  entry_start_time: "Entry Start", entry_end_time: "Entry End",
  exit_time: "Exit Time", strike_criteria: "Strike",
  stop_loss_in_pct: "Stop Loss", target_in_pct: "Target",
  quantity: "Lots", indicators: "Indicators",
  trailing_sl_enabled: "Trailing SL",
  trailing_sl_pct: "Trail Trigger",
  move_pct: "Move By",
};

// function fmtVal(key, val) {
//   if (key === "stop_loss_in_pct" || key === "target_in_pct") return `${val}%`;
//   if (key === "indicators") return Array.isArray(val) && val.length ? val.join(", ") : "None";
//   if (key === "start_date" || key === "end_date") {
//     const s = String(val);
//     return `20${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
//   }
//   return String(val);
// }

function fmtVal(key, val) {
  if (key === "stop_loss_in_pct" || key === "target_in_pct" ||
    key === "trailing_sl_pct" || key === "move_pct") return `${val}%`;
  if (key === "trailing_sl_enabled") return val ? "Enabled" : "Disabled";
  if (key === "indicators") return Array.isArray(val) && val.length ? val.join(", ") : "None";
  if (key === "start_date" || key === "end_date") {
    const s = String(val);
    return `20${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  }
  return String(val);
}


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


function RunCard({ params, onRun, onDecline, answered, running }) {
  // const entries = Object.entries(params).filter(([k, v]) => {

  //   if (FIELD_LABELS[k]) return true;

  //   if (k === "premium" && v !== null && v !== undefined && v !== 0) {
  //     const sc = String(params.strike_criteria || "").toLowerCase();
  //     return sc === "premium";
  //   }
  //   return false;
  // });
  const entries = Object.entries(params).filter(([k, v]) => {
    if (!FIELD_LABELS[k]) return false;
    // Only show premium when strike is premium
    if (k === "premium") {
      return v !== null && v !== undefined && v !== 0 &&
        String(params.strike_criteria || "").toLowerCase() === "premium";
    }
    // Only show trailing SL sub-fields when trailing is enabled
    if (k === "trailing_sl_pct" || k === "move_pct") {
      return params.trailing_sl_enabled === true;
    }
    // Hide trailing_sl_enabled itself if it's false (no point showing "Disabled" in RunCard)
    if (k === "trailing_sl_enabled") {
      return v === true;
    }
    return true;
  });


  const getLabel = (key) => key === "premium" ? "Premium" : (FIELD_LABELS[key] || key);
  const getVal = (key, val) => key === "premium" ? String(val) : fmtVal(key, val);
  return (
    <div className={`run-card ${answered ? "answered" : ""}`}>
      <div className="run-card-header">
        <span>🚀</span>
        <span className="run-card-title">Ready to Run Backtest</span>
      </div>
      <div className="run-card-params">
        {entries.map(([key, val]) => (
          <div className="run-card-row" key={key}>
            <span className="run-card-label">{getLabel(key)}</span>
            <span className="run-card-value">{getVal(key, val)}</span>
          </div>
        ))}
      </div>
      {!answered && (
        <div className="run-card-actions">
          <button className="run-card-yes" onClick={onRun} disabled={running}>
            {running ? "⏳ Running…" : "🚀 Run Backtest"}
          </button>
          <button className="run-card-no" onClick={onDecline} disabled={running}>✕ Cancel</button>
        </div>
      )}
      {answered === "running" && <div className="run-card-status running-status">⏳ Backtest running…</div>}
      {answered === "complete" && <div className="run-card-status complete-status">✓ Complete — see results below</div>}
      {answered === "declined" && <div className="run-card-status declined-status">✕ Cancelled</div>}
    </div>
  );
}

function SuggestionCard({ changes, baseForm, onConfirm, onDecline, answered, running }) {

  const entries = Object.entries(changes);

  return (
    <div className={`suggestion-card ${answered ? "answered" : ""}`}>
      <div className="suggestion-card-header">
        <span>⚡</span>
        <span className="suggestion-title">Optimized Parameters</span>
      </div>
      <div className="suggestion-params">
        {entries.length === 0 ? (
          <div className="suggestion-param-row">
            <span className="suggestion-param-label">No changes</span>
          </div>
        ) : (
          entries.map(([key, newVal]) => {
            const oldVal = baseForm?.[key];
            return (
              <div className="suggestion-param-row" key={key}>
                <span className="suggestion-param-label">{FIELD_LABELS[key] || key}</span>
                <span className="suggestion-param-value">
                  {oldVal !== undefined && (
                    <span className="suggestion-param-old">{fmtVal(key, oldVal)}</span>
                  )}
                  <span className="suggestion-param-arrow">→</span>
                  <span className="suggestion-param-new">{fmtVal(key, newVal)}</span>
                </span>
              </div>
            );
          })
        )}
      </div>
      {!answered && (
        <div className="suggestion-actions">
          <button className="suggestion-yes-btn" onClick={onConfirm} disabled={running}>
            {running ? "⏳ Running…" : "✓ Run Backtest"}
          </button>
          <button className="suggestion-no-btn" onClick={onDecline} disabled={running}>✕ Skip</button>
        </div>
      )}
      {answered === "running" && <div className="suggestion-answered running">⏳ Backtest running…</div>}
      {answered === "confirmed" && <div className="suggestion-answered confirmed">✓ Preparing backtest…</div>}
      {answered === "declined" && <div className="suggestion-answered declined">✕ Skipped</div>}
    </div>
  );
}


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


function SaveStrategyCard({ onSave, onSkip, status }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const handleSave = () => {
    if (!name.trim()) { setError("Please enter a strategy name"); return; }
    onSave(name.trim());
  };
  if (status === "saved")
    return <div className="save-card saved"><span>✓</span><span>Strategy saved to <strong>My Strategies</strong></span></div>;
  if (status === "skipped")
    return <div className="save-card skipped"><span>✕</span><span>Not saved</span></div>;
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


function Chatbot({ isOpen, onClose, backtestResults, form }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hey! I'm your **trading assistant** 🤖\n\nI can:\n• Analyze your current or saved strategies\n• Run a real backtest and interpret the results\n• Suggest parameter optimizations\n\nWhat would you like to do?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);


  const [runCardState, setRunCardState] = useState({});
  const [suggestionState, setSuggestionState] = useState({});
  const [saveCardStatus, setSaveCardStatus] = useState({});
  const [runningCard, setRunningCard] = useState(null);


  const [lastRunParams, setLastRunParams] = useState(null);

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

      const isInfoIntent = /\b(tell me about|describe|what is|what are|show me|explain|about|info|details)\b/i.test(text);
      const isRunIntent = !isInfoIntent && /\b(run|execute|backtest|test this|test it|start|launch)\b/i.test(text);
      const cardType = data.suggested_params && !isInfoIntent
        ? (isRunIntent ? "run" : "suggest")
        : null;

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply || "Sorry, no response received.",
        suggested_params: data.suggested_params || null,
        card_type: cardType,
        suggestion_base: cardType === "suggest" ? (lastRunParams || form) : null,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, couldn't connect to the server. Please try again.",
        suggested_params: null,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const executeBacktest = async (fullParams, runCardMsgIndex) => {
    setRunningCard(runCardMsgIndex);
    setRunCardState(prev => ({ ...prev, [runCardMsgIndex]: "running" }));

    try {
      const payload = { ...fullParams };
      delete payload.strike_mode;


      if (payload.premium !== undefined && payload.premium !== null) {
        payload.premium = Number(payload.premium) || 0;
      } else if (String(payload.strike_criteria).toLowerCase() === "premium") {

        payload.premium = 0;
      }

      const res = await fetch("http://localhost:5000/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("[Backtest] Server error:", res.status, errText);
        throw new Error(`HTTP ${res.status}`);
      }

      const results = await res.json();

      setRunCardState(prev => ({ ...prev, [runCardMsgIndex]: "complete" }));
      setLastRunParams(fullParams);

      if (!results.length) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Backtest ran but returned **no trades**.\n\n• The date range may have no market data\n• The entry window might be too narrow\n• Indicator filters may be too strict\n\nTry adjusting the date range or relaxing the entry conditions.",
          suggested_params: null,
        }]);
        return;
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: "✓ Backtest complete! Here are the results:",
        suggested_params: null,
        inline_results: results,
        show_save_card: true,
        run_params: fullParams,
      }]);

      await triggerAnalysis(fullParams, results);

    } catch {
      setRunCardState(prev => ({ ...prev, [runCardMsgIndex]: "complete" }));
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Backtest failed — server error. Check your parameters and try again.",
        suggested_params: null,
      }]);
    } finally {
      setRunningCard(null);
    }
  };

  const triggerAnalysis = async (params, results) => {
    const summary = buildResultsSummary(results);
    try {
      const res = await fetch("http://localhost:5000/chatbot/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ form: params, results_summary: summary, saved_strategies: savedStrategies }),
      });
      const data = await res.json();

      const reply = (data.reply || "").trim();
      if (!reply || reply.length < 10 || /^[{}\[\]"']+$/.test(reply)) return;

      setMessages(prev => [...prev, {
        role: "assistant",
        content: reply,
        suggested_params: data.suggested_params || null,
        card_type: data.suggested_params ? "suggest" : null,
        suggestion_base: params,
      }]);
    } catch { /* non-critical — analysis failure shouldn't break the backtest result */ }
  };


  const handleRunCard = (msgIndex, fullParams) => {
    executeBacktest(fullParams, msgIndex);
  };

  const handleDeclineRunCard = (msgIndex) => {
    setRunCardState(prev => ({ ...prev, [msgIndex]: "declined" }));
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "Cancelled. Let me know when you'd like to run it.",
      suggested_params: null,
    }]);
  };


  const handleConfirmSuggestion = (msgIndex, changes, baseForm) => {
    setSuggestionState(prev => ({ ...prev, [msgIndex]: "confirmed" }));


    const mergedParams = { ...(baseForm || form || {}), ...changes };


    const sc = String(mergedParams.strike_criteria || "").toLowerCase();
    if (sc !== "premium") {
      mergedParams.premium = null;
    }


    setMessages(prev => [...prev, {
      role: "assistant",
      content: "Here are the optimized parameters ready to run:",
      suggested_params: mergedParams,
      card_type: "run",
      suggestion_base: null,
    }]);
  };

  const handleDeclineSuggestion = (msgIndex) => {
    setSuggestionState(prev => ({ ...prev, [msgIndex]: "declined" }));
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "No problem! Let me know if you'd like to try different parameters.",
      suggested_params: null,
    }]);
  };

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
      setMessages(prev => [...prev, { role: "assistant", content: "Could not save — server error.", suggested_params: null }]);
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
    setLastRunParams(null);
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

        {showStrategiesPanel && (
          <StrategiesPanel
            strategies={savedStrategies}
            loading={strategiesLoading}
            onSelect={handleSelectStrategy}
            onClose={() => setShowStrategiesPanel(false)}
          />
        )}

        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className="chatbot-msg-group">

              <div className={`chatbot-msg-row ${msg.role}`}>
                {msg.role === "assistant" && <div className="chatbot-msg-avatar">🤖</div>}
                <div className={`chatbot-bubble ${msg.role}`}>
                  <RichText content={msg.content} />
                </div>
                {msg.role === "user" && <div className="chatbot-msg-avatar user-avatar">👤</div>}
              </div>

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

              {msg.role === "assistant" && msg.suggested_params && msg.card_type === "suggest" && (
                <div className="suggestion-card-wrapper">
                  <SuggestionCard
                    changes={msg.suggested_params}
                    baseForm={msg.suggestion_base}
                    answered={suggestionState[i]}
                    running={runningCard === i}
                    onConfirm={() => handleConfirmSuggestion(i, msg.suggested_params, msg.suggestion_base)}
                    onDecline={() => handleDeclineSuggestion(i)}
                  />
                </div>
              )}


              {msg.inline_results && (
                <div className="inline-report-wrapper">
                  <InlineReport results={msg.inline_results} />
                </div>
              )}

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

        {messages.length === 1 && (
          <div className="chatbot-quick-prompts">
            {quickPrompts.map((p, i) => (
              <button key={i} className="chatbot-quick-btn" onClick={() => sendMessage(p)}>{p}</button>
            ))}
          </div>
        )}

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