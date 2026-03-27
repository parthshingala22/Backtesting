import React,{useState} from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import Login from "./components/Login"
import Register from "./components/Register"
import BacktestForm from "./components/BacktestForm"
import Header from "./components/Header"

function App(){

  const [loggedIn,setLoggedIn] = useState(
    sessionStorage.getItem("token") !== null
  )

  const [showRegister,setShowRegister] = useState(false) 

  const handleLogout = () => {
    sessionStorage.removeItem("token")
    setLoggedIn(false)
  }

  const PrivateRoute = ({children}) => {
    return loggedIn ? children : <Navigate to="/" />
  }

  return(

    <div>

      {loggedIn && <Header onLogout={handleLogout}/>}

      <Routes>

        <Route path="/" element={
          loggedIn
            ? <Navigate to="/home"/>
            : <Login setLoggedIn={setLoggedIn} setShowRegister={setShowRegister}/>
        }/>

        <Route path="/register" element={
          <Register setShowRegister={setShowRegister}/>
        }/>

        <Route path="/home" element={
          <PrivateRoute>
            <h2 style={{padding:"30px"}}>🏠 Home Page (Coming Soon)</h2>
          </PrivateRoute>
        }/>

        <Route path="/backtest" element={
          <PrivateRoute>
            <BacktestForm/>
          </PrivateRoute>
        }/>

        <Route path="/optimizer" element={
          <PrivateRoute>
            <h2 style={{padding:"30px"}}>Optimizer Page (Coming Soon)</h2>
          </PrivateRoute>
        }/>

      </Routes>

    </div>

  )
}

export default App