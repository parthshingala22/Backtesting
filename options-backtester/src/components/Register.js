import React, { useState } from "react"
import { useNavigate } from "react-router-dom"

function Register() {

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const navigate = useNavigate()

  const handleRegister = async () => {

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

    const response = await fetch("http://localhost:5000/register", {
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

      setError("")
      setSuccess("Account created successfully")
      setUsername("")
      setPassword("")

      setTimeout(() => {
        navigate("/")
      }, 3000)

    } else {

      setSuccess("")
      setError(data.message || "Registration failed")

    }

  }

  return (

    <div className="login-container">

      <form
        className="login-box"
        onSubmit={(e) => {
          e.preventDefault()
          handleRegister()
        }}
      >

        <h2>Create Account</h2>

        <input
          type="text"
          placeholder="Username"
          onChange={(e) => {
            setUsername(e.target.value)
            setError("")
            setSuccess("")
          }}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => {
            setPassword(e.target.value)
            setError("")
            setSuccess("")
          }}
        />

        {error && <p className="error-text">{error}</p>}

        {success && <p className="success-text">{success}</p>}

        <button type="submit">
          Register
        </button>

        <p
          className="register-link"
          onClick={() => navigate("/")}
        >
          Back to Login
        </p>

      </form>

    </div>

  )

}

export default Register