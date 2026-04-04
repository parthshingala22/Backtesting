import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";

function Login({ setLoggedIn }) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ username: "", password: "" });

  const navigate = useNavigate();

  const validateField = (field, value) => {
    if (!value || value.trim() === "") {
      return `${field} is required`;
    }
    return "";
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    setFieldErrors({ username: "", password: "" });

    const usernameError = validateField("Username", username);
    const passwordError = validateField("Password", password);

    if (usernameError || passwordError) {
      setFieldErrors({ username: usernameError, password: passwordError });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("first_name", data.first_name);
        sessionStorage.setItem("last_name", data.last_name);
        setLoggedIn(true);
        setError("");
        navigate("/home");
      } else {
        setError(data.message || "Invalid username or password");
      }
    } catch (err) {
      setError("Connection error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form
        className="login-box"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        <h2>Login</h2>

        <div className="input-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
              setFieldErrors((prev) => ({ ...prev, username: "" }));
            }}
            className={fieldErrors.username ? "input-error" : ""}
          />
          {fieldErrors.username && (
            <span className="field-error">{fieldErrors.username}</span>
          )}
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
              setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            className={fieldErrors.password ? "input-error" : ""}
          />
          {fieldErrors.password && (
            <span className="field-error">{fieldErrors.password}</span>
          )}
        </div>

        {error && <p className="error-text">{error}</p>}

        <button
          type="submit"
          className={loading ? "loading" : ""}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="register-link" onClick={() => navigate("/register")}>
          Create New Account
        </p>
      </form>
    </div>
  );
}

export default Login;