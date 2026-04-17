// import React from "react";
// import { useNavigate } from "react-router-dom";
// import "./Home.css";

// function Home() {
//   const navigate = useNavigate();

//   const firstName = sessionStorage.getItem("first_name") || "Trader";

//   return (
//     <div className="home-container">

//       <div className="home-hero">
//         <h1>👋 Welcome, {firstName}</h1>
//         <p>
//           Analyze your trading strategies, run backtests, and improve performance using AI.
//         </p>

//         <div className="home-buttons">
//           <button onClick={() => navigate("/backtest")}>
//             🚀 Run Backtest
//           </button>

//           <button onClick={() => navigate("/strategies")}>
//             📂 View Strategies
//           </button>
//         </div>
//       </div>

//       <div className="home-features">

//         <div className="feature-card">
//           <h3>📊 Backtesting</h3>
//           <p>Test your strategies on historical data with detailed reports.</p>
//         </div>

//         <div className="feature-card">
//           <h3>🤖 AI Chatbot</h3>
//           <p>Ask questions and get insights about your strategy performance.</p>
//         </div>

//         <div className="feature-card">
//           <h3>⚡ Optimization</h3>
//           <p>Improve your strategy using smart suggestions.</p>
//         </div>

//       </div>

//     </div>
//   );
// }

// export default Home;


import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

// ── Animated equity curve SVG ─────────────────────────────────
function EquityCurve() {
  const points = [0, 8, 5, 20, 15, 35, 28, 22, 45, 38, 55, 30, 62, 48, 70, 40, 78, 58, 88, 50, 100];
  const coords = points.map((y, i, arr) => {
    const x = (i / (arr.length - 1)) * 800;
    const svgY = 100 - (y / 100) * 85;
    return `${x},${svgY}`;
  }).join(" ");
  const area = `0,100 ${coords} 800,100`;

  return (
    <svg className="hero-chart" viewBox="0 0 800 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1a9e5a" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#1a9e5a" stopOpacity="0"    />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <polygon points={area} fill="url(#curveGrad)" />
      <polyline
        points={coords}
        fill="none"
        stroke="#1a9e5a"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        filter="url(#glow)"
      />
      {/* End dot */}
      <circle cx="800" cy="14" r="4" fill="#1a9e5a" opacity="0.9" />
      <circle cx="800" cy="14" r="8" fill="#1a9e5a" opacity="0.2" />
    </svg>
  );
}

// ── Animated counter ──────────────────────────────────────────
function Counter({ target, prefix = "", suffix = "", decimals = 0, duration = 1800 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(parseFloat((eased * target).toFixed(decimals)));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, decimals]);

  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()}{suffix}
    </span>
  );
}

// ── Feature card data ─────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="feat-icon-svg">
        <rect x="4" y="24" width="6" height="12" rx="2" fill="#1a9e5a" opacity="0.8"/>
        <rect x="14" y="16" width="6" height="20" rx="2" fill="#1a9e5a"/>
        <rect x="24" y="8"  width="6" height="28" rx="2" fill="#1a9e5a" opacity="0.9"/>
        <path d="M6 22 L16 14 L26 6" stroke="#3dc98e" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Strategy Backtesting",
    desc: "Test NIFTY, BANKNIFTY & MCX strategies against tick-level historical data with precision entry/exit controls.",
    accent: "#1a9e5a",
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="feat-icon-svg">
        <circle cx="20" cy="20" r="13" stroke="#3b82f6" strokeWidth="2" opacity="0.4"/>
        <circle cx="20" cy="20" r="7"  stroke="#3b82f6" strokeWidth="2"/>
        <path d="M20 10 L22 16 L20 14 L18 16 Z" fill="#3b82f6"/>
        <path d="M12 16 L17 19 L15 20 L17 22 Z" fill="#3b82f6" opacity="0.7"/>
        <path d="M28 16 L23 19 L25 20 L23 22 Z" fill="#3b82f6" opacity="0.7"/>
      </svg>
    ),
    title: "AI Optimization",
    desc: "Your AI assistant analyzes real backtest results and suggests concrete parameter improvements backed by data.",
    accent: "#3b82f6",
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="feat-icon-svg">
        <path d="M8 32 C8 20, 32 20, 32 8" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
        <path d="M8 32 C8 24, 24 24, 28 14" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="28" cy="14" r="3.5" fill="#f59e0b"/>
        <circle cx="8"  cy="32" r="3.5" fill="#f59e0b" opacity="0.6"/>
      </svg>
    ),
    title: "Strike Flexibility",
    desc: "Run ATM, ITM1–10, OTM1–10 or Premium-based strategies. Compare strikes side by side with saved results.",
    accent: "#f59e0b",
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="feat-icon-svg">
        <rect x="6" y="10" width="28" height="22" rx="4" stroke="#a78bfa" strokeWidth="2"/>
        <path d="M12 18 L18 23 L28 15" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="32" cy="10" r="5" fill="#ef4444"/>
        <text x="32" y="14" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">!</text>
      </svg>
    ),
    title: "Strategy Library",
    desc: "Save, load and update unlimited strategies. Your entire trading playbook in one place, always ready.",
    accent: "#a78bfa",
  },
];

// ── Main component ────────────────────────────────────────────
function Home() {
  const navigate  = useNavigate();
  const firstName = sessionStorage.getItem("first_name") || "Trader";

  return (
    <div className="home-root">

      {/* ── Hero ── */}
      <section className="home-hero">
        {/* Background grid */}
        <div className="hero-grid-bg" aria-hidden="true" />
        {/* Glow blobs */}
        <div className="hero-blob hero-blob-1" aria-hidden="true" />
        <div className="hero-blob hero-blob-2" aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Live Backtesting Engine
          </div>

          <h1 className="hero-headline">
            Welcome back,<br />
            <span className="hero-name">{firstName}</span>
          </h1>

          <p className="hero-sub">
            Your edge is in the data. Run backtests, interpret results with AI,<br className="hero-br" />
            and sharpen your options strategy — all in one platform.
          </p>

          <div className="hero-actions">
            <button className="hero-btn-primary" onClick={() => navigate("/backtest")}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <polygon points="4,2 14,8 4,14" fill="currentColor"/>
              </svg>
              Run Backtest
            </button>
            <button className="hero-btn-secondary" onClick={() => navigate("/strategies")}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor"/>
                <rect x="2" y="7" width="8"  height="2" rx="1" fill="currentColor"/>
                <rect x="2" y="11" width="10" height="2" rx="1" fill="currentColor"/>
              </svg>
              My Strategies
            </button>
          </div>
        </div>

        {/* Equity chart */}
        <div className="hero-chart-wrap" aria-hidden="true">
          <div className="hero-chart-label">Equity Curve — Sample Run</div>
          <EquityCurve />
        </div>
      </section>

      {/* ── Stats row ── */}
      <section className="home-stats">
        <div className="stat-item">
          <div className="stat-value green">
            <Counter target={72.7} suffix="%" decimals={1} />
          </div>
          <div className="stat-label">Sample Win Rate</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-value">
            <Counter target={3.88} suffix="×" decimals={2} />
          </div>
          <div className="stat-label">Profit Factor</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-value green">
            ₹<Counter target={67597} duration={2000} />
          </div>
          <div className="stat-label">Sample PnL</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-value">
            <Counter target={4} suffix=" Strike Types" />
          </div>
          <div className="stat-label">ATM · ITM · OTM · Premium</div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="home-features">
        <div className="features-header">
          <h2 className="features-title">Everything you need to trade smarter</h2>
          <p className="features-sub">A complete toolkit for NSE options backtesting</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div className="feat-card" key={i} style={{"--accent": f.accent}}>
              <div className="feat-icon-wrap">{f.icon}</div>
              <h3 className="feat-title">{f.title}</h3>
              <p className="feat-desc">{f.desc}</p>
              <div className="feat-line" />
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="home-cta">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to find your edge?</h2>
          <p className="cta-sub">Load a saved strategy or start a fresh backtest right now.</p>
          <div className="cta-actions">
            <button className="hero-btn-primary" onClick={() => navigate("/backtest")}>
              Start Backtesting →
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;