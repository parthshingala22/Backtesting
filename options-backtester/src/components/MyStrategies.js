import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./MyStrategies.css";

function fmtDate(d) {
  if (!d) return "—";
  const s = String(d);
  return `20${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
}

function strikeLabel(sc) {
  if (!sc) return "ATM";
  if (sc === "premium") return "Premium";
  return sc;
}

function strikeBadgeClass(sc) {
  if (!sc || sc === "ATM") return "badge-atm";
  if (sc === "premium") return "badge-premium";
  if (String(sc).startsWith("ITM")) return "badge-itm";
  if (String(sc).startsWith("OTM")) return "badge-otm";
  return "badge-atm";
}

function Sparkline({ id }) {
  const seed = (id || 1) * 7;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const y = 18 - (Math.abs(Math.sin((i + seed) * 1.3)) * 14);
    return `${i * 11},${y.toFixed(1)}`;
  }).join(" ");
  const profit = (id % 3) !== 0;
  return (
    <svg className="strat-sparkline" viewBox="0 0 99 22" preserveAspectRatio="none">
      <polyline points={pts} fill="none"
        stroke={profit ? "#1a9e5a" : "#e74c3c"}
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


function EmptyState({ onNavigate }) {
  return (
    <div className="ms-empty">
      <div className="ms-empty-icon">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="16" width="48" height="36" rx="6" stroke="#c8d6e5" strokeWidth="2" />
          <path d="M16 36 L24 28 L32 33 L42 22 L52 26" stroke="#1a9e5a" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="52" cy="26" r="3" fill="#1a9e5a" />
          <path d="M24 46 L40 46" stroke="#c8d6e5" strokeWidth="2" strokeLinecap="round" />
          <path d="M29 42 L35 42" stroke="#c8d6e5" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="ms-empty-title">No strategies saved yet</h3>
      <p className="ms-empty-sub">Run a backtest and save your first strategy to build your playbook.</p>
      <button className="ms-cta-btn" onClick={onNavigate}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <polygon points="4,2 14,8 4,14" fill="currentColor" />
        </svg>
        Run Your First Backtest
      </button>
    </div>
  );
}


function StrategyCard({ strategy, onLoad, onDelete, index }) {
  const f = strategy.formData || {};
  return (
    <div
      className="ms-card"
      style={{ animationDelay: `${index * 0.06}s` }}
    >

      <div className="ms-card-index">{String(index + 1).padStart(2, "0")}</div>


      <div className="ms-card-body" onClick={() => onLoad(strategy)}>
        {/* <div className="ms-card-top">
          <span className="ms-card-name">{strategy.name}</span>
          <span className={`ms-badge ${strikeBadgeClass(f.strike_criteria)}`}>
            {strikeLabel(f.strike_criteria)}
          </span>
        </div> */}
        <div className="ms-card-top">
          <span className="ms-card-name">{strategy.name}</span>
          <span className={`ms-badge ${strikeBadgeClass(f.strike_criteria)}`}>
            {strikeLabel(f.strike_criteria)}
          </span>
          {f.trailing_sl_enabled && (
            <span className="ms-badge badge-trail">
              Trail SL
            </span>
          )}
        </div>

        <div className="ms-card-meta">
          <span className="ms-meta-item">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M4 1 L4 3 M8 1 L8 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            {fmtDate(f.start_date)} → {fmtDate(f.end_date)}
          </span>
          <span className="ms-meta-item">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M3 6 L5 8 L9 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {f.index || "—"}
          </span>
          <span className="ms-meta-item">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M6 3.5 L6 6 L7.5 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            {f.interval || "—"}
          </span>
          {/* <span className="ms-meta-item">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 9 L5 5 L7.5 7 L10 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            SL {f.stop_loss_in_pct}% · Tgt {f.target_in_pct}%
          </span> */}
          <span className="ms-meta-item">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 9 L5 5 L7.5 7 L10 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            SL {f.stop_loss_in_pct}% · Tgt {f.target_in_pct}%
          </span>
          {f.trailing_sl_enabled && (
            <span className="ms-meta-item">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 8 L4 5 L6 7 L8 4 L10 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 9 L8 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="1 1.5" />
              </svg>
              Trail {f.trailing_sl_pct}% · Move {f.move_pct}%
            </span>
          )}
          {f.indicators?.length > 0 && (
            <span className="ms-meta-item">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4 6 L5.5 7.5 L8 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f.indicators.map(i => i === "rsi" ? "RSI" : "Engulfing").join(", ")}
            </span>
          )}
        </div>
      </div>

      <div className="ms-card-spark">
        <Sparkline id={strategy.id} />
      </div>


      <div className="ms-card-actions">
        <button className="ms-load-btn" onClick={() => onLoad(strategy)} title="Load into Backtest">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <polygon points="3,1 13,7 3,13" fill="currentColor" />
          </svg>
          Load
        </button>
        <button className="ms-del-btn" onClick={() => onDelete(strategy.id, strategy.name)} title="Delete">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M2 4 L12 4 M5 4 L5 2 L9 2 L9 4 M5.5 6.5 L5.5 11 M8.5 6.5 L8.5 11 M3 4 L3.5 12 L10.5 12 L11 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function DeletePopup({ name, onConfirm, onCancel }) {
  return (
    <div className="ms-overlay">
      <div className="ms-popup">
        <div className="ms-popup-icon">
          <svg viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="#e74c3c" strokeWidth="2" opacity="0.2" />
            <circle cx="20" cy="20" r="13" fill="#fff0f0" stroke="#e74c3c" strokeWidth="1.5" />
            <path d="M20 13 L20 22" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="27" r="1.5" fill="#e74c3c" />
          </svg>
        </div>
        <h3 className="ms-popup-title">Delete Strategy?</h3>
        <p className="ms-popup-sub">
          You're about to delete <strong>"{name}"</strong>.<br />
          This action cannot be undone.
        </p>
        <div className="ms-popup-actions">
          <button className="ms-popup-cancel" onClick={onCancel}>Cancel</button>
          <button className="ms-popup-confirm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function MyStrategies({ setForm, setLoadedStrategy }) {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletePopup, setDeletePopup] = useState({ show: false, id: null, name: "" });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchStrategies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/strategies", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStrategies(data);
    } catch {
      showToast("Failed to load strategies", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchStrategies(); }, [fetchStrategies]);

  const loadStrategy = (strategy) => {
    setForm(strategy.formData);
    setLoadedStrategy({ name: strategy.name, id: strategy.id });
    navigate("/backtest");
  };

  const confirmDelete = (id, name) => setDeletePopup({ show: true, id, name });

  const deleteStrategy = async () => {
    const { id } = deletePopup;
    setDeletePopup({ show: false, id: null, name: "" });
    try {
      await fetch(`http://localhost:5000/strategies/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setStrategies(s => s.filter(x => x.id !== id));
      showToast("Strategy deleted");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const filtered = strategies.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ms-root">

      <div className="ms-page-header">
        <div className="ms-page-header-bg" aria-hidden="true" />
        <div className="ms-page-header-inner">
          <div className="ms-page-header-left">
            <h1 className="ms-page-title">My Strategies</h1>
            <p className="ms-page-sub">Your saved backtesting playbook</p>
          </div>
          <div className="ms-page-header-right">
            <div className="ms-count-chip">
              <span className="ms-count-num">{strategies.length}</span>
              <span className="ms-count-label">saved</span>
            </div>
            <button className="ms-cta-btn" onClick={() => navigate("/backtest")}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <polygon points="4,2 14,8 4,14" fill="currentColor" />
              </svg>
              New Backtest
            </button>
          </div>
        </div>
      </div>

      <div className="ms-body">

        {loading && (
          <div className="ms-loading">
            <div className="ms-spinner" />
            <span>Loading strategies…</span>
          </div>
        )}

        {!loading && strategies.length === 0 && (
          <EmptyState onNavigate={() => navigate("/backtest")} />
        )}

        {!loading && strategies.length > 0 && (
          <>
            <div className="ms-search-wrap">
              <svg className="ms-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="5" stroke="#94a3b8" strokeWidth="1.5" />
                <path d="M11 11 L14 14" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className="ms-search"
                placeholder="Search strategies…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="ms-search-clear" onClick={() => setSearch("")}>✕</button>
              )}
            </div>

            <div className="ms-list-header">
              <span className="ms-lh-num">#</span>
              <span className="ms-lh-name">Strategy</span>
              <span className="ms-lh-spark">Trend</span>
              <span className="ms-lh-actions">Actions</span>
            </div>


            <div className="ms-list">
              {filtered.length === 0 ? (
                <div className="ms-no-results">No strategies match "{search}"</div>
              ) : (
                filtered.map((s, i) => (
                  <StrategyCard
                    key={s.id}
                    strategy={s}
                    index={i}
                    onLoad={loadStrategy}
                    onDelete={confirmDelete}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {deletePopup.show && (
        <DeletePopup
          name={deletePopup.name}
          onConfirm={deleteStrategy}
          onCancel={() => setDeletePopup({ show: false, id: null, name: "" })}
        />
      )}

      {toast.show && (
        <div className={`ms-toast ${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast({ ...toast, show: false })}>✕</button>
        </div>
      )}
    </div>
  );
}

export default MyStrategies;