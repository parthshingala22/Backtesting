// import React,{useState} from "react"
// import { Routes, Route, Navigate } from "react-router-dom"

// import Login from "./components/Login"
// import Register from "./components/Register"
// import BacktestForm from "./components/BacktestForm"
// import Header from "./components/Header"

// function App(){

//   const [loggedIn,setLoggedIn] = useState(
//     sessionStorage.getItem("token") !== null  
//   )

//   const [showRegister,setShowRegister] = useState(false) 

//   const handleLogout = () => {
//     sessionStorage.removeItem("token")
//     setLoggedIn(false)
//   }

//   const PrivateRoute = ({children}) => {
//     return loggedIn ? children : <Navigate to="/" />
//   }

//   return(

//     <div>

//       {loggedIn && <Header onLogout={handleLogout}/>}

//       <Routes>

//         <Route path="/" element={
//           loggedIn
//             ? <Navigate to="/home"/>
//             : <Login setLoggedIn={setLoggedIn} setShowRegister={setShowRegister}/>
//         }/>

//         <Route path="/register" element={
//           <Register setShowRegister={setShowRegister}/>
//         }/>

//         <Route path="/home" element={
//           <PrivateRoute>
//             <h2 style={{padding:"30px"}}>🏠 Home Page (Coming Soon)</h2>
//           </PrivateRoute>
//         }/>

//         <Route path="/backtest" element={
//           <PrivateRoute>
//             <BacktestForm/>
//           </PrivateRoute>
//         }/>

//       </Routes>

//     </div>

//   )
// }

// export default App


import React, { useState } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import Login from "./components/Login"
import Register from "./components/Register"
import BacktestForm from "./components/BacktestForm"
import Header from "./components/Header"
import MyStrategies from "./components/MyStrategies"

function App() {

  const [loggedIn, setLoggedIn] = useState(
    sessionStorage.getItem("token") !== null
  )

  // 🔥 MOVE FORM HERE
  const [form, setForm] = useState({
    start_date: 220101,
    end_date: 220131,
    index: "NIFTY",
    interval: "1min",
    indicators: [],
    entry_time: "09:15",
    exit_time: "10:15",
    strike_mode: "Strike Type",
    strike_criteria: "ATM",
    premium: null,
    stop_loss_in_pct: 10,
    target_in_pct: 20,
    quantity: 10
  })

  const handleLogout = () => {
    sessionStorage.removeItem("token")
    setLoggedIn(false)
  }

  const PrivateRoute = ({ children }) => {
    return loggedIn ? children : <Navigate to="/" />
  }

  return (

    <div>

      {loggedIn && <Header onLogout={handleLogout} />}

      <Routes>

        <Route path="/" element={
          loggedIn
            ? <Navigate to="/home" />
            : <Login setLoggedIn={setLoggedIn} />
        } />

        <Route path="/register" element={<Register />} />

        <Route path="/home" element={
          <PrivateRoute>
            <h2 style={{ padding: "30px" }}>🏠 Home Page</h2>
          </PrivateRoute>
        } />

        <Route path="/backtest" element={
          <PrivateRoute>
            <BacktestForm form={form} setForm={setForm} />
          </PrivateRoute>
        } />

        {/* 🔥 NEW PAGE */}
        <Route path="/strategies" element={
          <PrivateRoute>
            <MyStrategies setForm={setForm} />
          </PrivateRoute>
        } />

      </Routes>

    </div>
  )
}

export default App