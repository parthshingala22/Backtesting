import React,{useState} from "react"

function Register({ setShowRegister }){

  const [username,setUsername] = useState("")
  const [password,setPassword] = useState("")

  const handleRegister = async () => {

    const response = await fetch("http://localhost:5000/register",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        username:username,
        password:password
      })
    })

    const data = await response.json()

    if(data.success){
      alert("Account created successfully")
      setShowRegister(false)
    }
    else{
      alert(data.message)
    }

  }

  return(

    <div className="login-container">

      <div className="login-box">

        <h2>Create Account</h2>

        <input
          type="text"
          placeholder="Username"
          onChange={(e)=>setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button onClick={handleRegister}>
          Register
        </button>

        <p className="register-link" onClick={()=>setShowRegister(false)}>
          Back to Login
        </p>

      </div>

    </div>

  )

}

export default Register