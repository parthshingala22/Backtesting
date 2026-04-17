import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";

function EquityChart() {
  const points = [0, 18, 12, 30, 22, 44, 35, 28, 52, 38, 68, 30, 74, 50, 82, 42, 100]
    .map((y, i, arr) => {
      const x = (i / (arr.length - 1)) * 340;
      const svgY = 90 - (y / 100) * 80;
      return `${x},${svgY}`;
    })
    .join(" ");

  const areaPoints = `0,90 ${points} 340,90`;

  return (
    <svg className="auth-chart-svg" viewBox="0 0 340 90" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3dc98e" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3dc98e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#chartGrad)" />
      <polyline
        points={points}
        fill="none"
        stroke="#3dc98e"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AuthLeft() {
  return (
    <div className="auth-left">
      <div className="auth-brand">
        {/* <div className="auth-brand-logo">
          <div className="auth-brand-icon">📈</div>
          <div>
            <div className="auth-brand-name">BacktestPro</div>
            <div className="auth-brand-tagline">Options Strategy Platform</div>
          </div>
        </div> */}

        <div className="auth-brand-logo">
          <svg width="760" height="160" viewBox="0 0 560 160" xmlns="http://www.w3.org/2000/svg" style={{ width: "260px", height: "auto" }}>
            <g transform="translate(-120,-30) scale(2.5)">
              <path d="M15 55 C25 35, 45 35, 55 55 C65 75, 85 75, 75 50 C65 25, 45 25, 35 50 C25 75, 5 75, 15 55"
                fill="none" stroke="#1a9e5a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="35" cy="50" r="3.5" fill="#ffffff" />
              <circle cx="75" cy="50" r="3.5" fill="#ffffff" />
            </g>
            <text x="120" y="100"
            font-family="Inter, Segoe UI, Arial"
            font-size="80"
            fill="#ffffff"
            font-weight="700"
            letter-spacing="1">
            Backtest<tspan fill="#1a9e5a">Pro</tspan>
          </text>

          <text x="120" y="150"
            font-family="Inter, Segoe UI, Arial"
            font-size="28"
            fill="rgba(255,255,255,0.7)">
            Continuous Strategy Optimization
          </text>
          </svg>
        </div>

        <h1 className="auth-headline">
          Test strategies.<br />
          <span>Trade smarter.</span>
        </h1>
        <p className="auth-subline">
          Backtest your options strategies on historical NIFTY, BANKNIFTY, and MCX data with real tick-level precision.
        </p>

        <div className="auth-chart-wrap">
          <EquityChart />
          <div className="auth-stats-row">
            <div className="auth-stat">
              <div className="auth-stat-value green">+72.7%</div>
              <div className="auth-stat-label">Win Rate</div>
            </div>
            <div className="auth-stat">
              <div className="auth-stat-value">3.88×</div>
              <div className="auth-stat-label">Profit Factor</div>
            </div>
            <div className="auth-stat">
              <div className="auth-stat-value green">₹67.5K</div>
              <div className="auth-stat-label">Sample PnL</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function Login({ setLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ username: "", password: "" });

  const navigate = useNavigate();

  const validate = (field, value) => {
    if (!value || !value.trim()) return `${field} is required`;
    return "";
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    setFieldErrors({ username: "", password: "" });

    const usernameErr = validate("Username", username);
    const passwordErr = validate("Password", password);

    if (usernameErr || passwordErr) {
      setFieldErrors({ username: usernameErr, password: passwordErr });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Network error");

      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("first_name", data.first_name);
        sessionStorage.setItem("last_name", data.last_name);
        setLoggedIn(true);
        navigate("/home");
      } else {
        setError(data.message || "Invalid username or password");
      }
    } catch {
      setError("Connection error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthLeft />

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-title">Welcome back</div>
            <div className="auth-card-sub">Sign in to your account to continue</div>
          </div>

          <form onSubmit={e => { e.preventDefault(); handleLogin(); }}>
            <div className="auth-field">
              <label className="auth-field-label">Username</label>
              <input
                type="text"
                className={`auth-input ${fieldErrors.username ? "error" : ""}`}
                placeholder="Enter your username"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  setError("");
                  setFieldErrors(p => ({ ...p, username: "" }));
                }}
                autoComplete="username"
              />
              {fieldErrors.username && (
                <span className="auth-field-error">{fieldErrors.username}</span>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-field-label">Password</label>
              <input
                type="password"
                className={`auth-input ${fieldErrors.password ? "error" : ""}`}
                placeholder="Enter your password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError("");
                  setFieldErrors(p => ({ ...p, password: "" }));
                }}
                autoComplete="current-password"
              />
              {fieldErrors.password && (
                <span className="auth-field-error">{fieldErrors.password}</span>
              )}
            </div>

            {error && (
              <div className="auth-alert error">⚠ {error}</div>
            )}

            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account?
            <span className="auth-switch-link" onClick={() => navigate("/register")}>
              Create one
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;