// // import React, { useState } from "react"
// // import { useNavigate } from "react-router-dom"

// // function Register() {

// //   const [username, setUsername] = useState("")
// //   const [password, setPassword] = useState("")
// //   const [showPassword, setShowPassword] = useState(false)
// //   const [firstName, setFirstName] = useState("")
// //   const [middleName, setMiddleName] = useState("")
// //   const [lastName, setLastName] = useState("")
// //   const [error, setError] = useState("")
// //   const [success, setSuccess] = useState("")
// //   const [loading, setLoading] = useState(false)
// //   const [fieldErrors, setFieldErrors] = useState({})

// //   const navigate = useNavigate()

// //   const validateField = (field, value) => {
// //     if (!value || value.trim() === "") {
// //       return `${field} is required`
// //     }
// //     if (field === "Username" && value.length < 3) {
// //       return "Username must be at least 3 characters"
// //     }
// //     if (field === "Password" && value.length < 6) {
// //       return "Password must be at least 6 characters"
// //     }
// //     return ""
// //   }

// //   const handleRegister = async () => {
// //     setLoading(true)
// //     setError("")
// //     setSuccess("")
// //     setFieldErrors({})

// //     const errors = {}
// //     errors.firstName = validateField("First Name", firstName)
// //     errors.lastName = validateField("Last Name", lastName)
// //     errors.username = validateField("Username", username)
// //     errors.password = validateField("Password", password)

// //     const hasErrors = Object.values(errors).some(err => err !== "")

// //     if (hasErrors) {
// //       setFieldErrors(errors)
// //       setLoading(false)
// //       return
// //     }

// //     try {
// //       const response = await fetch("http://localhost:5000/register", {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json"
// //         },
// //         body: JSON.stringify({
// //           first_name: firstName,
// //           middle_name: middleName,
// //           last_name: lastName,
// //           username,
// //           password
// //         })
// //       })

// //       if (!response.ok) {
// //         throw new Error("Network response was not ok")
// //       }

// //       const data = await response.json()

// //       if (data.success) {

// //         setError("")
// //         setSuccess("Account created successfully")
// //         setFirstName("")
// //         setMiddleName("")
// //         setLastName("")
// //         setUsername("")
// //         setPassword("")
// //         setFieldErrors({})

// //         setTimeout(() => {
// //           navigate("/")
// //         }, 2000)

// //       } else {

// //         setSuccess("")
// //         setError(data.message || "Registration failed")

// //       }
// //     } catch (err) {
// //       setError("Connection error. Please check if the server is running.")
// //     } finally {
// //       setLoading(false)
// //     }

// //   }

// //   return (

// //     <div className="login-container">

// //       <form
// //         className="login-box"
// //         onSubmit={(e) => {
// //           e.preventDefault()
// //           handleRegister()
// //         }}
// //       >

// //         <h2>Create Account</h2>

// //         <div className="input-group">
// //           <input
// //             type="text"
// //             placeholder="First Name *"
// //             value={firstName}
// //             onChange={(e) => {
// //               setFirstName(e.target.value)
// //               setError("")
// //               setSuccess("")
// //               setFieldErrors(prev => ({ ...prev, firstName: "" }))
// //             }}
// //             className={fieldErrors.firstName ? "input-error" : ""}
// //           />
// //           {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
// //         </div>

// //         <div className="input-group">
// //           <input
// //             type="text"
// //             placeholder="Middle Name (Optional)"
// //             value={middleName}
// //             onChange={(e) => {
// //               setMiddleName(e.target.value)
// //               setError("")
// //               setSuccess("")
// //             }}
// //           />
// //         </div>

// //         <div className="input-group">
// //           <input
// //             type="text"
// //             placeholder="Last Name *"
// //             value={lastName}
// //             onChange={(e) => {
// //               setLastName(e.target.value)
// //               setError("")
// //               setSuccess("")
// //               setFieldErrors(prev => ({ ...prev, lastName: "" }))
// //             }}
// //             className={fieldErrors.lastName ? "input-error" : ""}
// //           />
// //           {fieldErrors.lastName && <span className="field-error">{fieldErrors.lastName}</span>}
// //         </div>

// //         <div className="input-group">
// //           <input
// //             type="text"
// //             placeholder="Username"
// //             value={username}
// //             onChange={(e) => {
// //               setUsername(e.target.value)
// //               setError("")
// //               setSuccess("")
// //               setFieldErrors(prev => ({ ...prev, username: "" }))
// //             }}
// //             className={fieldErrors.username ? "input-error" : ""}
// //           />
// //           {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
// //         </div>

// //         <div className="input-group">
// //           <div className="password-input-wrapper">
// //             <input
// //               type={showPassword ? "text" : "password"}
// //               placeholder="Password"
// //               value={password}
// //               onChange={(e) => {
// //                 setPassword(e.target.value)
// //                 setError("")
// //                 setSuccess("")
// //                 setFieldErrors(prev => ({ ...prev, password: "" }))
// //               }}
// //               className={fieldErrors.password ? "input-error" : ""}
// //             />
// //             <button
// //               type="button"
// //               className="toggle-password"
// //               onClick={() => setShowPassword(!showPassword)}
// //             >
// //               {showPassword ? "Hide" : "Show"}
// //             </button>
// //           </div>
// //           {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
// //         </div>

// //         {error && <p className="error-text">{error}</p>}

// //         {success && <p className="success-text">{success}</p>}

// //         <button type="submit" className={loading ? "loading" : ""} disabled={loading}>
// //           {loading ? "Creating Account..." : "Register"}
// //         </button>

// //         <p
// //           className="register-link"
// //           onClick={() => navigate("/")}
// //         >
// //           Back to Login
// //         </p>

// //       </form>

// //     </div>

// //   )

// // }

// // export default Register


// import React, { useState } from "react";
// import "./Login.css";
// import { useNavigate } from "react-router-dom";

// function Register() {

//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [firstName, setFirstName] = useState("");
//   const [middleName, setMiddleName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [fieldErrors, setFieldErrors] = useState({});

//   const navigate = useNavigate();

//   const validateField = (field, value) => {
//     if (!value || value.trim() === "") {
//       return `${field} is required`;
//     }
//     if (field === "Username" && value.length < 3) {
//       return "Username must be at least 3 characters";
//     }
//     if (field === "Password" && value.length < 6) {
//       return "Password must be at least 6 characters";
//     }
//     return "";
//   };

//   const handleRegister = async () => {
//     setLoading(true);
//     setError("");
//     setSuccess("");
//     setFieldErrors({});

//     const errors = {};
//     errors.firstName = validateField("First Name", firstName);
//     errors.lastName = validateField("Last Name", lastName);
//     errors.username = validateField("Username", username);
//     errors.password = validateField("Password", password);

//     const hasErrors = Object.values(errors).some((err) => err !== "");

//     if (hasErrors) {
//       setFieldErrors(errors);
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await fetch("http://localhost:5000/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           first_name: firstName,
//           middle_name: middleName,
//           last_name: lastName,
//           username,
//           password,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Network response was not ok");
//       }

//       const data = await response.json();

//       if (data.success) {
//         setError("");
//         setSuccess("Account created successfully");
//         setFirstName("");
//         setMiddleName("");
//         setLastName("");
//         setUsername("");
//         setPassword("");
//         setFieldErrors({});

//         setTimeout(() => {
//           navigate("/");
//         }, 2000);
//       } else {
//         setSuccess("");
//         setError(data.message || "Registration failed");
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
//           handleRegister();
//         }}
//       >
//         <h2>Create Account</h2>

//         <div className="input-group">
//           <input
//             type="text"
//             placeholder="First Name *"
//             value={firstName}
//             onChange={(e) => {
//               setFirstName(e.target.value);
//               setError("");
//               setSuccess("");
//               setFieldErrors((prev) => ({ ...prev, firstName: "" }));
//             }}
//             className={fieldErrors.firstName ? "input-error" : ""}
//           />
//           {fieldErrors.firstName && (
//             <span className="field-error">{fieldErrors.firstName}</span>
//           )}
//         </div>

//         <div className="input-group">
//           <input
//             type="text"
//             placeholder="Middle Name (Optional)"
//             value={middleName}
//             onChange={(e) => {
//               setMiddleName(e.target.value);
//               setError("");
//               setSuccess("");
//             }}
//           />
//         </div>

//         <div className="input-group">
//           <input
//             type="text"
//             placeholder="Last Name *"
//             value={lastName}
//             onChange={(e) => {
//               setLastName(e.target.value);
//               setError("");
//               setSuccess("");
//               setFieldErrors((prev) => ({ ...prev, lastName: "" }));
//             }}
//             className={fieldErrors.lastName ? "input-error" : ""}
//           />
//           {fieldErrors.lastName && (
//             <span className="field-error">{fieldErrors.lastName}</span>
//           )}
//         </div>

//         <div className="input-group">
//           <input
//             type="text"
//             placeholder="Username"
//             value={username}
//             onChange={(e) => {
//               setUsername(e.target.value);
//               setError("");
//               setSuccess("");
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
//               setSuccess("");
//               setFieldErrors((prev) => ({ ...prev, password: "" }));
//             }}
//             className={fieldErrors.password ? "input-error" : ""}
//           />
//           {fieldErrors.password && (
//             <span className="field-error">{fieldErrors.password}</span>
//           )}
//         </div>

//         {error && <p className="error-text">{error}</p>}
//         {success && <p className="success-text">{success}</p>}

//         <button
//           type="submit"
//           className={loading ? "loading" : ""}
//           disabled={loading}
//         >
//           {loading ? "Creating Account..." : "Register"}
//         </button>

//         <p className="register-link" onClick={() => navigate("/")}>
//           Back to Login
//         </p>
//       </form>
//     </div>
//   );
// }

// export default Register;
import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";

// ── Decorative equity chart SVG (same as Login) ───────────────
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
        <linearGradient id="chartGradR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3dc98e" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3dc98e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#chartGradR)" />
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
          Start backtesting<br />
          <span>in minutes.</span>
        </h1>
        <p className="auth-subline">
          Create your free account and begin testing options strategies on real historical data from NIFTY, BANKNIFTY, and MCX.
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

// ── Register component ────────────────────────────────────────
function Register() {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  const validate = (field, value) => {
    if (!value || !value.trim()) return `${field} is required`;
    if (field === "Username" && value.length < 3) return "At least 3 characters";
    if (field === "Password" && value.length < 6) return "At least 6 characters";
    return "";
  };

  const clearFieldErr = (key) =>
    setFieldErrors(p => ({ ...p, [key]: "" }));

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setFieldErrors({});

    const errors = {
      firstName: validate("First Name", firstName),
      lastName: validate("Last Name", lastName),
      username: validate("Username", username),
      password: validate("Password", password),
    };

    if (Object.values(errors).some(e => e)) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          username,
          password,
        }),
      });

      if (!res.ok) throw new Error("Network error");

      const data = await res.json();

      if (data.success) {
        setSuccess("Account created! Redirecting to login…");
        setTimeout(() => navigate("/"), 2000);
      } else {
        setError(data.message || "Registration failed. Try a different username.");
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
            <div className="auth-card-title">Create account</div>
            <div className="auth-card-sub">Fill in your details to get started</div>
          </div>

          <form onSubmit={e => { e.preventDefault(); handleRegister(); }}>

            {/* First + Last name on one row */}
            <div className="auth-name-row">
              <div className="auth-field" style={{ marginBottom: 0 }}>
                <label className="auth-field-label">First Name *</label>
                <input
                  type="text"
                  className={`auth-input ${fieldErrors.firstName ? "error" : ""}`}
                  placeholder="First"
                  value={firstName}
                  onChange={e => { setFirstName(e.target.value); clearFieldErr("firstName"); setError(""); setSuccess(""); }}
                />
                {fieldErrors.firstName && (
                  <span className="auth-field-error">{fieldErrors.firstName}</span>
                )}
              </div>

              <div className="auth-field" style={{ marginBottom: 0 }}>
                <label className="auth-field-label">Last Name *</label>
                <input
                  type="text"
                  className={`auth-input ${fieldErrors.lastName ? "error" : ""}`}
                  placeholder="Last"
                  value={lastName}
                  onChange={e => { setLastName(e.target.value); clearFieldErr("lastName"); setError(""); setSuccess(""); }}
                />
                {fieldErrors.lastName && (
                  <span className="auth-field-error">{fieldErrors.lastName}</span>
                )}
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-field-label">Middle Name <span style={{ textTransform: "none", fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
              <input
                type="text"
                className="auth-input"
                placeholder="Middle name"
                value={middleName}
                onChange={e => { setMiddleName(e.target.value); setError(""); setSuccess(""); }}
              />
            </div>

            <div className="auth-field">
              <label className="auth-field-label">Username *</label>
              <input
                type="text"
                className={`auth-input ${fieldErrors.username ? "error" : ""}`}
                placeholder="Choose a username"
                value={username}
                onChange={e => { setUsername(e.target.value); clearFieldErr("username"); setError(""); setSuccess(""); }}
                autoComplete="username"
              />
              {fieldErrors.username && (
                <span className="auth-field-error">{fieldErrors.username}</span>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-field-label">Password *</label>
              <input
                type="password"
                className={`auth-input ${fieldErrors.password ? "error" : ""}`}
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => { setPassword(e.target.value); clearFieldErr("password"); setError(""); setSuccess(""); }}
                autoComplete="new-password"
              />
              {fieldErrors.password && (
                <span className="auth-field-error">{fieldErrors.password}</span>
              )}
            </div>

            {error && <div className="auth-alert error">⚠ {error}</div>}
            {success && <div className="auth-alert success">✓ {success}</div>}

            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account?
            <span className="auth-switch-link" onClick={() => navigate("/")}>
              Sign in
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;