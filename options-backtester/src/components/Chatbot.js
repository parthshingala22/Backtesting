import React, { useState, useRef, useEffect } from "react";
import "./Chatbot.css";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS, CategoryScale, LinearScale,
    PointElement, LineElement, Tooltip, Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const FIELD_LABELS = {
    index: "Index", interval: "Interval",
    start_date: "Start Date", end_date: "End Date",
    entry_start_time: "Entry Start", entry_end_time: "Entry End",
    exit_time: "Exit Time", strike_criteria: "Strike",
    stop_loss_in_pct: "Stop Loss", target_in_pct: "Target",
    quantity: "Lots", indicators: "Indicators",
};

function formatParamValue(key, val) {
    if (key === "stop_loss_in_pct" || key === "target_in_pct") return `${val}%`;
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
        const nodes = parts.map((part, pi) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={pi}>{part.slice(2, -2)}</strong>;
            }
            return <span key={pi}>{part}</span>;
        });

        const isBullet = line.trimStart().startsWith("•") || line.trimStart().startsWith("-");
        if (isBullet) {
            return (
                <div key={idx} className="chat-bullet-line">
                    <span className="chat-bullet-dot">•</span>
                    <span>{nodes}</span>
                </div>
            );
        }
        if (line.trim() === "") return <div key={idx} className="chat-line-gap" />;
        return <div key={idx} className="chat-text-line">{nodes}</div>;
    };

    return <div className="chat-rich-text">{content.split("\n").map(renderLine)}</div>;
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
    const equityCurve = results.map(t => {
        eq += t.Profit_n_Loss;
        if (eq > peak) peak = eq;
        const dd = peak - eq;
        if (dd > maxDD) maxDD = dd;
        return eq;
    });

    const chartData = {
        labels: results.map((_, i) => i + 1),
        datasets: [{
            data: equityCurve,
            borderColor: totalPnL >= 0 ? "#10b981" : "#ef4444",
            backgroundColor: totalPnL >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.3,
            fill: true,
        }],
    };

    const stats = [
        { label: "Total PnL", value: `₹${totalPnL.toFixed(2)}`, color: totalPnL >= 0 ? "#10b981" : "#ef4444" },
        { label: "Trades", value: results.length },
        { label: "Win Rate", value: `${winRate}%`, color: winRate >= 50 ? "#10b981" : "#ef4444" },
        { label: "Profit Factor", value: profitFactor },
        { label: "Max Drawdown", value: `₹${maxDD.toFixed(0)}`, color: "#ef4444" },
    ];

    return (
        <div className="inline-report">
            <div className="inline-report-header">📊 AI Backtest Result</div>
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
                {wins.length}W / {losses.length}L · Gross Profit ₹{grossProfit.toFixed(0)} · Gross Loss ₹{grossLoss.toFixed(0)}
            </div>
        </div>
    );
}

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
                <span className="suggestion-title">Suggested Parameters</span>
            </div>
            <div className="suggestion-params">
                {changedEntries.length === 0 ? (
                    <div className="suggestion-param-row">
                        <span className="suggestion-param-label">Config</span>
                        <span className="suggestion-param-new">Same as current</span>
                    </div>
                ) : changedEntries.map(([key, val]) => (
                    <div className="suggestion-param-row" key={key}>
                        <span className="suggestion-param-label">{FIELD_LABELS[key] || key}</span>
                        <span className="suggestion-param-value">
                            {currentForm?.[key] !== undefined && (
                                <span className="suggestion-param-old">{formatParamValue(key, currentForm[key])}</span>
                            )}
                            <span className="suggestion-param-arrow">→</span>
                            <span className="suggestion-param-new">{formatParamValue(key, val)}</span>
                        </span>
                    </div>
                ))}
            </div>
            {!answered && (
                <div className="suggestion-actions">
                    <button className="suggestion-yes-btn" onClick={onConfirm} disabled={running}>
                        {running ? "Running…" : "✓ Run Backtest"}
                    </button>
                    <button className="suggestion-no-btn" onClick={onDecline} disabled={running}>✕ Skip</button>
                </div>
            )}
            {answered === "confirmed" && <div className="suggestion-answered confirmed">✓ Backtest complete — see results above</div>}
            {answered === "declined" && <div className="suggestion-answered declined">✕ Skipped</div>}
        </div>
    );
}

function Chatbot({ isOpen, onClose, backtestResults, form }) {
    const [messages, setMessages] = useState([{
        role: "assistant",
        content: "Hey! I'm your **trading assistant** 🤖\n\nI can:\n• Analyze your strategy\n• Interpret backtest results\n• Suggest optimizations\n• Run a backtest with AI-suggested parameters\n\nWhat would you like to do?",
    }]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [answeredSuggestions, setAnsweredSuggestions] = useState({});
    const [runningSuggestion, setRunningSuggestion] = useState(null);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const token = sessionStorage.getItem("token");

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
    useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 120); }, [isOpen]);

    const buildResultsSummary = () => {
        if (!backtestResults?.length) return null;
        const wins = backtestResults.filter(t => t.Profit_n_Loss > 0);
        const losses = backtestResults.filter(t => t.Profit_n_Loss <= 0);
        return {
            total_trades: backtestResults.length,
            win_trades: wins.length, loss_trades: losses.length,
            total_pnl: backtestResults.reduce((s, t) => s + t.Profit_n_Loss, 0).toFixed(2),
            win_rate: ((wins.length / backtestResults.length) * 100).toFixed(2),
            gross_profit: wins.reduce((s, t) => s + t.Profit_n_Loss, 0).toFixed(2),
            gross_loss: losses.reduce((s, t) => s + Math.abs(t.Profit_n_Loss), 0).toFixed(2),
            sample_trades: backtestResults.slice(0, 5),
        };
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
                    context: { form: form || null, results_summary: buildResultsSummary() },
                }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, {
                role: "assistant",
                content: data.reply || "Sorry, no response received.",
                suggested_params: data.suggested_params || null,
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Sorry, I couldn't connect to the server. Please try again.",
                suggested_params: null,
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSuggestion = async (msgIndex, suggestedParams) => {
        setRunningSuggestion(msgIndex);

        try {
            const payload = { ...suggestedParams };
            delete payload.strike_mode;

            const res = await fetch("http://localhost:5000/backtest", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const results = await res.json();

            setAnsweredSuggestions(prev => ({ ...prev, [msgIndex]: "confirmed" }));

            setMessages(prev => [...prev, {
                role: "assistant",
                content: results.length
                    ? `✓ Backtest complete! Here are the results for the suggested parameters:`
                    : "The backtest ran but returned no trades. Try adjusting the date range or entry window.",
                suggested_params: null,
                inline_results: results.length ? results : null,
            }]);
        } catch {
            setAnsweredSuggestions(prev => ({ ...prev, [msgIndex]: "confirmed" }));
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Backtest failed — the server returned an error. Please check your parameters and try again.",
                suggested_params: null,
            }]);
        } finally {
            setRunningSuggestion(null);
        }
    };

    const handleDeclineSuggestion = (msgIndex) => {
        setAnsweredSuggestions(prev => ({ ...prev, [msgIndex]: "declined" }));
        setMessages(prev => [...prev, {
            role: "assistant",
            content: "No problem! Let me know if you'd like to tweak the parameters or try a different approach.",
            suggested_params: null,
        }]);
    };

    const clearChat = () => {
        setMessages([{
            role: "assistant",
            content: "Chat cleared! Ready to help. What would you like to analyze?",
        }]);
        setAnsweredSuggestions({});
    };

    const quickPrompts = [
        "Analyze my strategy",
        "Suggest better parameters",
        "Why is my win rate low?",
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
                        <button className="chatbot-icon-btn" onClick={clearChat} title="Clear">🗑</button>
                        <button className="chatbot-icon-btn" onClick={onClose} title="Close">✕</button>
                    </div>
                </div>

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

                            {msg.inline_results && (
                                <div className="inline-report-wrapper">
                                    <InlineReport results={msg.inline_results} />
                                </div>
                            )}

                            {msg.role === "assistant" && msg.suggested_params && !msg.inline_results && (
                                <div className="suggestion-card-wrapper">
                                    <SuggestionCard
                                        params={msg.suggested_params}
                                        currentForm={form}
                                        answered={answeredSuggestions[i]}
                                        running={runningSuggestion === i}
                                        onConfirm={() => handleConfirmSuggestion(i, msg.suggested_params)}
                                        onDecline={() => handleDeclineSuggestion(i)}
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
                        placeholder="Ask about your strategy or request an optimized backtest…"
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