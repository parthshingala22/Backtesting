import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom"

function Login({ setLoggedIn, setShowRegister }) {

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const [error, setError] = useState("")

  const handleLogin = async () => {

    if (!username && !password) {
      setError("Please enter username and password")
      return
    }

    if (!username) {
      setError("Please enter username")
      return
    }

    if (!password) {
      setError("Please enter password")
      return
    }

    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    })

    const data = await response.json()

    if (data.success) {

      sessionStorage.setItem("token", data.token)

      sessionStorage.setItem("first_name", data.first_name)
      sessionStorage.setItem("last_name", data.last_name)

      setLoggedIn(true)

      setError("")

      navigate("/home")

    }
    else {
      setError(data.message || "Invalid username or password")
    }

  }

  return (

    <div className="login-container">

      <form className="login-box" onSubmit={(e) => {
        e.preventDefault()
        handleLogin()
      }}>

        <h2>Login</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            setError("")
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError("")
          }}
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit">
          Login
        </button>

        <p
          className="register-link"
          onClick={() => navigate("/register")}
        >
          Create New Account
        </p>

      </form>

    </div>

  )

}

export default Login