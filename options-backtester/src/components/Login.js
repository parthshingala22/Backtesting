import React, { useState } from "react";
import "./Login.css";

function Login({ setLoggedIn, setShowRegister }) {

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  // const handleLogin = async () => {

  //   const response = await fetch("http://localhost:5000/login",{
  //     method:"POST",
  //     headers:{
  //       "Content-Type":"application/json"
  //     },
  //     body:JSON.stringify({
  //       username:username,
  //       password:password
  //     })
  //   })

  //   const data = await response.json()

  //   if(data.success){
  //     setLoggedIn(true)
  //   }
  //   else{
  //     alert("Invalid login")
  //   }

  // }

  const handleLogin = async () => {

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

      // localStorage.setItem("token", data.token)
      sessionStorage.setItem("token",data.token)
      
      setLoggedIn(true)

    }
    else {
      alert("Invalid login")
    }

  }


  return (

    <div className="login-container">

      <div className="login-box">

        <h2>Login</h2>

        <input
          type="text"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>
          Login
        </button>

        <p
          className="register-link"
          onClick={() => setShowRegister(true)}
        >
          Create New Account
        </p>

      </div>

    </div>

  )

}

export default Login