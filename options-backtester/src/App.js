
import React, { useState } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import Login from "./components/Login"
import Register from "./components/Register"
import BacktestForm from "./components/BacktestForm"
import Header from "./components/Header"
import MyStrategies from "./components/MyStrategies"

// const defaultForm = {
//   start_date: 220101,
//   end_date: 220131,
//   index: "NIFTY",
//   interval: "1min",
//   indicators: [],
//   entry_time: "09:15",
//   exit_time: "10:15",
//   strike_mode: "Strike Type",
//   strike_criteria: "ATM",
//   premium: null,
//   stop_loss_in_pct: 10,
//   target_in_pct: 20,
//   quantity: 10
// }

const defaultForm = {
  start_date: 220101,
  end_date: 220131,
  index: "NIFTY",
  interval: "1min",
  indicators: [],
  entry_start_time: "09:15",   // ← renamed
  entry_end_time: "10:15",     // ← new
  exit_time: "11:00",
  strike_mode: "Strike Type",
  strike_criteria: "ATM",
  premium: null,
  stop_loss_in_pct: 10,
  target_in_pct: 20,
  quantity: 10
}

function App() {

  const [loggedIn, setLoggedIn] = useState(
    sessionStorage.getItem("token") !== null
  )

  const [pendingForm, setPendingForm] = useState(null)
  const [loadedStrategy, setLoadedStrategy] = useState(null)

  const handleLogout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("first_name")   
    sessionStorage.removeItem("last_name")    
    setLoggedIn(false)
    setLoadedStrategy(null)       
    setPendingForm(defaultForm)   
  }

  const PrivateRoute = ({ children }) => {
    return loggedIn ? children : <Navigate to="/" />
  }

  return (
    <div>
      {loggedIn && <Header onLogout={handleLogout} />} 

      <Routes>
        <Route path="/" element={
          loggedIn ? <Navigate to="/home" /> : <Login setLoggedIn={setLoggedIn} />
        } />

        <Route path="/register" element={<Register />} />

        <Route path="/home" element={
          <PrivateRoute>
            <h2 style={{ padding: "30px" }}>🏠 Home Page</h2>
          </PrivateRoute>
        } />

        <Route path="/backtest" element={
          <PrivateRoute>
            <BacktestForm
              pendingForm={pendingForm}
              loadedStrategy={loadedStrategy}
              setLoadedStrategy={setLoadedStrategy}
            />
          </PrivateRoute>
        } />

        <Route path="/strategies" element={
          <PrivateRoute>
            <MyStrategies
              setForm={setPendingForm}
              setLoadedStrategy={setLoadedStrategy}
            />
          </PrivateRoute>
        } />
      </Routes>
    </div>
  )
}

export default App