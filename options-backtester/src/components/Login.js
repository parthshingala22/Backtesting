// import React, { useState } from "react";
// import "./Login.css";
// import { useNavigate } from "react-router-dom";

// function Login({ setLoggedIn }) {

//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [fieldErrors, setFieldErrors] = useState({ username: "", password: "" });

//   const navigate = useNavigate();

//   const validateField = (field, value) => {
//     if (!value || value.trim() === "") {
//       return `${field} is required`;
//     }
//     return "";
//   };

//   const handleLogin = async () => {
//     setLoading(true);
//     setError("");
//     setFieldErrors({ username: "", password: "" });

//     const usernameError = validateField("Username", username);
//     const passwordError = validateField("Password", password);

//     if (usernameError || passwordError) {
//       setFieldErrors({ username: usernameError, password: passwordError });
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await fetch("http://localhost:5000/login", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ username, password }),
//       });

//       if (!response.ok) {
//         throw new Error("Network response was not ok");
//       }

//       const data = await response.json();

//       if (data.success) {
//         sessionStorage.setItem("token", data.token);
//         sessionStorage.setItem("first_name", data.first_name);
//         sessionStorage.setItem("last_name", data.last_name);
//         setLoggedIn(true);
//         setError("");
//         navigate("/home");
//       } else {
//         setError(data.message || "Invalid username or password");
//       }
//     } catch (err) {
//       setError("Connection error. Please check if the server is running.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-container">
//       <form
//         className="login-box"
//         onSubmit={(e) => {
//           e.preventDefault();
//           handleLogin();
//         }}
//       >
//         <h2>Login</h2>

//         <div className="input-group">
//           <input
//             type="text"
//             placeholder="Username"
//             value={username}
//             onChange={(e) => {
//               setUsername(e.target.value);
//               setError("");
//               setFieldErrors((prev) => ({ ...prev, username: "" }));
//             }}
//             className={fieldErrors.username ? "input-error" : ""}
//           />
//           {fieldErrors.username && (
//             <span className="field-error">{fieldErrors.username}</span>
//           )}
//         </div>

//         <div className="input-group">
//           <input
//             type="password"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => {
//               setPassword(e.target.value);
//               setError("");
//               setFieldErrors((prev) => ({ ...prev, password: "" }));
//             }}
//             className={fieldErrors.password ? "input-error" : ""}
//           />
//           {fieldErrors.password && (
//             <span className="field-error">{fieldErrors.password}</span>
//           )}
//         </div>

//         {error && <p className="error-text">{error}</p>}

//         <button
//           type="submit"
//           className={loading ? "loading" : ""}
//           disabled={loading}
//         >
//           {loading ? "Logging in..." : "Login"}
//         </button>

//         <p className="register-link" onClick={() => navigate("/register")}>
//           Create New Account
//         </p>
//       </form>
//     </div>
//   );
// }

// export default Login;

import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";

// ── Decorative equity chart SVG ───────────────────────────────
function EquityChart() {
  const points = [0,18,12,30,22,44,35,28,52,38,68,30,74,50,82,42,100]
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
          <stop offset="0%"   stopColor="#3dc98e" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3dc98e" stopOpacity="0"    />
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

// ── Left branding panel ───────────────────────────────────────
function AuthLeft() {
  return (
    <div className="auth-left">
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <div className="auth-brand-icon">📈</div>
          <div>
            <div className="auth-brand-name">BacktestPro</div>
            <div className="auth-brand-tagline">Options Strategy Platform</div>
          </div>
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

      {/* <div className="auth-left-footer">© 2024 BacktestPro · All rights reserved</div> */}
    </div>
  );
}

// ── Login component ───────────────────────────────────────────
function Login({ setLoggedIn }) {
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [fieldErrors, setFieldErrors]   = useState({ username: "", password: "" });

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
      const res  = await fetch("http://localhost:5000/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Network error");

      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem("token",      data.token);
        sessionStorage.setItem("first_name", data.first_name);
        sessionStorage.setItem("last_name",  data.last_name);
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