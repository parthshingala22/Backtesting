import React, { useState, useEffect } from "react";
import "./BacktestForm.css";
import Chatbot from "./Chatbot";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);


function ToggleGroup({ options, value, onChange }) {
  return (
    <div className="toggle-group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`toggle-btn ${value === opt.value ? "toggle-active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SectionPanel({ title, children }) {
  return (
    <div className="section-panel">
      <div className="section-panel-title">{title}</div>
      <div className="section-panel-body">{children}</div>
    </div>
  );
}

function FormRow({ label, info, children }) {
  return (
    <div className="form-row">
      <div className="form-row-label">
        {label}
        {info && <span className="info-icon" title={info}>ⓘ</span>}
      </div>
      <div className="form-row-control">{children}</div>
    </div>
  );
}


function BacktestForm({ pendingForm, loadedStrategy, setLoadedStrategy }) {

  const [showPopup, setShowPopup] = useState(false);
  const [strategyName, setStrategyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [startPage, setStartPage] = useState(1);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [chatOpen, setChatOpen] = useState(false);

  const [form, setForm] = useState({
    start_date: 220101,
    end_date: 220131,
    index: "NIFTY",
    interval: "1min",
    indicators: [],
    entry_start_time: "09:15",
    entry_end_time: "10:15",
    exit_time: "11:00",
    strike_mode: "Strike Type",
    strike_criteria: "ATM",
    itm_level: "ITM1",
    otm_level: "OTM1",
    premium: null,
    stop_loss_in_pct: 10,
    target_in_pct: 20,
    quantity: 10
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    if (pendingForm) setForm(pendingForm);
    if (loadedStrategy) setEditedName(loadedStrategy.name);
  }, [pendingForm, loadedStrategy]);

  const formatDate = (dateNum) => {
    if (!dateNum) return "";
    const s = String(dateNum);
    return `20${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (name === "start_date" || name === "end_date") {
      const d = new Date(value);
      value = Number(
        String(d.getFullYear()).slice(2) +
        String(d.getMonth() + 1).padStart(2, "0") +
        String(d.getDate()).padStart(2, "0")
      );
    }
    if (type === "number") value = Number(value);
    setForm({ ...form, [name]: value });
  };

  const handleRunBacktestFromChat = async (suggestedParams) => {
    setForm(suggestedParams);
    setChatOpen(false);
    setTimeout(async () => {
      try {
        setLoading(true);
        const payload = { ...suggestedParams };
        delete payload.strike_mode;   // backend doesn't use this field
        const token = sessionStorage.getItem("token");
        const response = await fetch("http://localhost:5000/backtest", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Backtest from chat failed:", error);
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  const runBacktest = async () => {
    try {
      setLoading(true);
      const payload = { ...form };
      delete payload.strike_mode;
      const token = sessionStorage.getItem("token");
      const response = await fetch("http://localhost:5000/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveStrategy = async () => {
    if (!strategyName) { showToast("Enter strategy name", "error"); return; }
    const token = sessionStorage.getItem("token");
    const response = await fetch("http://localhost:5000/strategies", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: strategyName, formData: form })
    });
    const data = await response.json();
    if (data.success) {
      showToast("Strategy saved successfully");
      setShowPopup(false);
      setStrategyName("");
    }
  };

  const updateStrategy = async () => {
    if (!loadedStrategy) return;
    const token = sessionStorage.getItem("token");
    await fetch(`http://localhost:5000/strategies/${loadedStrategy.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: loadedStrategy.name, formData: form })
    });
    showToast("Strategy updated successfully");
  };

  const saveStrategyName = async () => {
    if (!editedName.trim()) { showToast("Strategy name cannot be empty", "error"); return; }
    const token = sessionStorage.getItem("token");
    await fetch(`http://localhost:5000/strategies/${loadedStrategy.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editedName.trim(), formData: form })
    });
    setLoadedStrategy({ ...loadedStrategy, name: editedName.trim() });
    setIsEditingName(false);
    showToast("Strategy name updated");
  };

  const downloadReport = () => {
    if (!results.length) { alert("No report available"); return; }
    const cols = ["Date", "Symbol", "Buy_Price", "Sell_Price", "Entry_Time", "Exit_Time", "Profit_n_Loss", "Exit_Reason"];
    const csv = [cols.join(","), ...results.map(r => cols.map(c => r[c]).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "backtest_report.csv";
    a.click();
  };


  const totalTrades = results.length;
  const winTrades = results.filter(t => t.Profit_n_Loss > 0).length;
  const lossTrades = results.filter(t => t.Profit_n_Loss <= 0).length;
  const totalPnL = results.reduce((s, t) => s + t.Profit_n_Loss, 0);
  const winRate = totalTrades ? ((winTrades / totalTrades) * 100).toFixed(2) : 0;
  const grossProfit = results.filter(t => t.Profit_n_Loss > 0).reduce((s, t) => s + t.Profit_n_Loss, 0);
  const grossLoss = results.filter(t => t.Profit_n_Loss < 0).reduce((s, t) => s + Math.abs(t.Profit_n_Loss), 0);
  const profitFactor = grossLoss ? (grossProfit / grossLoss).toFixed(2) : 0;

  let equity = 0, peak = 0, maxDrawdown = 0;
  results.forEach(t => {
    equity += t.Profit_n_Loss;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  let eq1 = 0;
  const equityData = results.map(t => { eq1 += Number(t.Profit_n_Loss); return eq1; });
  const chartData = {
    labels: results.map((_, i) => i + 1),
    datasets: [{
      label: "Equity Curve",
      data: equityData,
      borderColor: "#1e4d72",
      backgroundColor: "rgba(30,77,114,0.1)",
      tension: 0.3,
      pointRadius: 2
    }]
  };

  const tradesPerPage = 10;
  const visiblePages = 5;
  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = results.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(results.length / tradesPerPage);
  const pageNumbers = [];
  for (let i = startPage; i < startPage + visiblePages && i <= totalPages; i++) pageNumbers.push(i);

  const goNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      if (currentPage >= startPage + visiblePages - 1) setStartPage(startPage + 1);
    }
  };
  const goPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      if (currentPage <= startPage) setStartPage(startPage - 1);
    }
  };
  const goFirst = () => { setCurrentPage(1); setStartPage(1); };
  const goLast = () => {
    const lastStart = Math.max(totalPages - visiblePages + 1, 1);
    setCurrentPage(totalPages);
    setStartPage(lastStart);
  };

  const popups = [
    { show: showPopup, title: "Save New Strategy", name: strategyName, setName: setStrategyName, onClose: () => setShowPopup(false), onDone: saveStrategy },
    { show: isEditingName, title: "Edit Strategy Name", name: editedName, setName: setEditedName, onClose: () => setIsEditingName(false), onDone: saveStrategyName },
  ];

  return (
    <div className="bf-root">

      {loadedStrategy && (
        <div className="loaded-strategy-bar">
          <div className="strategy-name-display">
            <span className="loaded-name">{loadedStrategy.name}</span>
            <button
              className="name-edit-btn"
              onClick={() => { setEditedName(loadedStrategy.name); setIsEditingName(true); }}
            >
              ✏️ Edit Name
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Running Backtest...</p>
        </div>
      )}

      <div className="bf-body">

        {/* Period bar */}
        <div className="period-bar">
          <div className="period-field">
            <label className="period-label">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={formatDate(form.start_date)}
              onChange={handleChange}
              className="period-input"
            />
          </div>
          <div className="period-sep">→</div>
          <div className="period-field">
            <label className="period-label">End Date</label>
            <input
              type="date"
              name="end_date"
              value={formatDate(form.end_date)}
              onChange={handleChange}
              className="period-input"
            />
          </div>
          <div className="period-field">
            <label className="period-label">Interval</label>
            <select name="interval" value={form.interval} onChange={handleChange} className="period-select">
              <option>1min</option>
              <option>3min</option>
              <option>5min</option>
              <option>15min</option>
            </select>
          </div>
        </div>

        <div className="panels-grid">

          <div className="panels-col">

            <SectionPanel title="Instrument settings">
              <FormRow label="Index">
                <select name="index" value={form.index} onChange={handleChange} className="field-select">
                  <option>NIFTY</option>
                  <option>BANKNIFTY</option>
                  <option>MCX</option>
                </select>
              </FormRow>
            </SectionPanel>

            <SectionPanel title="Strike criteria">
              <FormRow label="Strike Criteria">
                <select
                  name="strike_mode"
                  value={form.strike_mode}
                  onChange={e => {
                    const v = e.target.value;
                    setForm({
                      ...form,
                      strike_mode: v,
                      strike_criteria: v === "Strike Type" ? "ATM" : "premium",
                      premium: v === "Premium Based" ? 250 : null
                    });
                  }}
                  className="field-select"
                >
                  <option>Strike Type</option>
                  <option>Premium Based</option>
                </select>
              </FormRow>

              {form.strike_mode === "Strike Type" ? (
                <>
                  <FormRow label="Strike Type">
                    <ToggleGroup
                      options={[
                        { value: "ATM", label: "ATM" },
                        { value: "ITM", label: "ITM" },
                        { value: "OTM", label: "OTM" }
                      ]}
                      value={
                        form.strike_criteria === "ATM" ? "ATM"
                          : form.strike_criteria.startsWith("ITM") ? "ITM"
                            : "OTM"
                      }
                      onChange={v => {
                        if (v === "ATM") {
                          setForm({ ...form, strike_criteria: "ATM" });
                        } else if (v === "ITM") {
                          setForm({ ...form, strike_criteria: form.itm_level || "ITM1" });
                        } else {
                          setForm({ ...form, strike_criteria: form.otm_level || "OTM1" });
                        }
                      }}
                    />
                  </FormRow>

                  {form.strike_criteria.startsWith("ITM") && (
                    <FormRow label="ITM Level">
                      <select
                        className="field-select"
                        value={form.strike_criteria}
                        onChange={e => setForm({ ...form, strike_criteria: e.target.value, itm_level: e.target.value })}
                      >
                        {["ITM1", "ITM2", "ITM3", "ITM4", "ITM5", "ITM6", "ITM7", "ITM8", "ITM9", "ITM10"].map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </FormRow>
                  )}

                  {form.strike_criteria.startsWith("OTM") && (
                    <FormRow label="OTM Level">
                      <select
                        className="field-select"
                        value={form.strike_criteria}
                        onChange={e => setForm({ ...form, strike_criteria: e.target.value, otm_level: e.target.value })}
                      >
                        {["OTM1", "OTM2", "OTM3", "OTM4", "OTM5", "OTM6", "OTM7", "OTM8", "OTM9", "OTM10"].map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </FormRow>
                  )}
                </>
              ) : (
                <FormRow label="Premium">
                  <input
                    type="number"
                    name="premium"
                    placeholder="Enter Premium"
                    value={form.premium || ""}
                    onChange={handleChange}
                    className="field-input"
                  />
                </FormRow>
              )}
            </SectionPanel>

            <SectionPanel title="Risk management">
              <FormRow label="Stop Loss (%)">
                <input type="number" name="stop_loss_in_pct" value={form.stop_loss_in_pct} onChange={handleChange} className="field-input small" />
              </FormRow>
              <FormRow label="Target (%)">
                <input type="number" name="target_in_pct" value={form.target_in_pct} onChange={handleChange} className="field-input small" />
              </FormRow>
              <FormRow label="Lots">
                <input type="number" name="quantity" value={form.quantity} onChange={handleChange} className="field-input small" />
              </FormRow>
            </SectionPanel>

          </div>

          <div className="panels-col">

            <SectionPanel title="Entry settings">
              <div className="time-triple-row">
                <FormRow label="Entry Start Time">
                  <input type="time" name="entry_start_time" value={form.entry_start_time} onChange={handleChange} className="field-input time-input" />
                </FormRow>
                <FormRow label="Entry End Time">
                  <input type="time" name="entry_end_time" value={form.entry_end_time} onChange={handleChange} className="field-input time-input" />
                </FormRow>
                <FormRow label="Exit Time">
                  <input type="time" name="exit_time" value={form.exit_time} onChange={handleChange} className="field-input time-input" />
                </FormRow>
              </div>
            </SectionPanel>

            <SectionPanel title="Indicators">
              <FormRow label="Add Indicator">
                <select
                  className="field-select"
                  onChange={e => {
                    const v = e.target.value;
                    if (!v || form.indicators.includes(v)) return;
                    setForm({ ...form, indicators: [...form.indicators, v] });
                    e.target.value = "";
                  }}
                >
                  <option value="">Select Indicator</option>
                  <option value="rsi">RSI</option>
                  <option value="bullish_n_bearish_engulfing">Engulfing</option>
                </select>
              </FormRow>
              {form.indicators.length > 0 && (
                <div className="indicator-bucket">
                  {form.indicators.map((ind, i) => (
                    <div className="indicator-tag" key={i}>
                      {ind === "rsi" ? "RSI" : "Engulfing"}
                      <span onClick={() => setForm({ ...form, indicators: form.indicators.filter(x => x !== ind) })}>✕</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionPanel>

          </div>

        </div>

        {results.length > 0 && (
          <>
            <div className="report-chart-container">

              <div className="strategy-report">
                <h2 className="report-title">Strategy Report</h2>
                {[
                  { label: "Total PnL", value: `₹ ${totalPnL.toFixed(2)}`, cls: totalPnL >= 0 ? "profit" : "loss" },
                  { label: "Total Trades", value: totalTrades },
                  { label: "Win Trades", value: winTrades, cls: "profit" },
                  { label: "Loss Trades", value: lossTrades, cls: "loss" },
                  { label: "Win Rate", value: `${winRate}%` },
                  { label: "Profit Factor", value: profitFactor },
                  { label: "Max Drawdown", value: `₹ ${maxDrawdown.toFixed(2)}`, cls: "loss" },
                ].map(({ label, value, cls }) => (
                  <div className="report-row" key={label}>
                    <span>{label}</span>
                    <span className={cls || ""}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="equity-chart">
                <h2 className="report-title">Equity Curve</h2>
                <Line
                  data={chartData}
                  options={{
                    plugins: { legend: { display: false } },
                    scales: { x: { display: false } }
                  }}
                />
              </div>

            </div>

            <div className="results-section">
              <h2 className="section-heading">📊 Trade Results</h2>
              <table className="results-table">
                <thead>
                  <tr>
                    {["#", "Date", "Symbol", "Entry Time", "Exit Time", "Buy Price", "Sell Price", "PnL", "Exit Reason"].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentTrades.map((trade, i) => (
                    <tr key={i}>
                      <td>{indexOfFirstTrade + i + 1}</td>
                      <td>{trade.Date}</td>
                      <td>{trade.Symbol}</td>
                      <td>{trade.Entry_Time}</td>
                      <td>{trade.Exit_Time}</td>
                      <td>{trade.Buy_Price}</td>
                      <td>{trade.Sell_Price}</td>
                      <td className={trade.Profit_n_Loss >= 0 ? "profit-green" : "loss-red"}>
                        {trade.Profit_n_Loss}
                      </td>
                      <td>{trade.Exit_Reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="table-footer">
                <button onClick={downloadReport} className="download-btn">⬇ Download Report</button>
                <div className="pagination-container">
                  <button onClick={goFirst}>«</button>
                  <button onClick={goPrevPage}>‹</button>
                  {pageNumbers.map(p => (
                    <button
                      key={p}
                      className={currentPage === p ? "active-page" : ""}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button onClick={goNextPage}>›</button>
                  <button onClick={goLast}>»</button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      <div className="footer">
        <div className="footer-btn">
          {loadedStrategy ? (
            <>
              <button className="save-btn" onClick={updateStrategy}>💾 Update Strategy</button>
              <button className="saveas-btn" onClick={() => setShowPopup(true)}>➕ Save as New</button>
            </>
          ) : (
            <button className="save-btn" onClick={() => setShowPopup(true)}>💾 Save Strategy</button>
          )}

          <button className="chatbot-trigger-btn" onClick={() => setChatOpen(true)}>
            🤖 AI Assistant
          </button>

          <button className="run-btn" onClick={runBacktest}>🚀 Run Backtest</button>
        </div>
      </div>

      {popups.map(({ show, title, name, setName, onClose, onDone }, idx) =>
        show ? (
          <div className="popup-overlay" key={idx}>
            <div className="popup">
              <div className="popup-header">
                <h3 className="popup-header-name">{title}</h3>
                <span className="popup-close-tag" onClick={onClose}>✕</span>
              </div>
              <hr />
              <div className="strategy-name-container">
                <p className="strategy-name-label">Strategy Name:</p>
                <input
                  type="text"
                  className="strategy-name-input"
                  placeholder="Enter Strategy Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="popup-actions">
                <button className="popup-btn" onClick={onClose}>Cancel</button>
                <button className="popup-btn" onClick={onDone}>Done</button>
              </div>
            </div>
          </div>
        ) : null
      )}

      {toast.show && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast({ ...toast, show: false })}>✕</button>
        </div>
      )}

      <Chatbot
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        backtestResults={results}
        form={form}
      />

    </div>
  );
}

export default BacktestForm;