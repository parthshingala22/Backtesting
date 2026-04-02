// import React, { useState} from "react"
// import { Routes, Route, Navigate } from "react-router-dom"

// import Login from "./components/Login"
// import Register from "./components/Register"
// import BacktestForm from "./components/BacktestForm"
// import Header from "./components/Header"
// import MyStrategies from "./components/MyStrategies"

// function App() {

//   const [loggedIn, setLoggedIn] = useState(
//     sessionStorage.getItem("token") !== null
//   )

//   const [pendingForm, setPendingForm] = useState(null)

//   const handleLogout = () => {
//     sessionStorage.removeItem("token")
//     setLoggedIn(false)
//   }

//   const PrivateRoute = ({ children }) => {
//     return loggedIn ? children : <Navigate to="/" />
//   }

//   return (
//     <div>
//       {loggedIn && <Header onLogout={handleLogout} />}

//       <Routes>
//         <Route path="/" element={
//           loggedIn ? <Navigate to="/home" /> : <Login setLoggedIn={setLoggedIn} />
//         } />

//         <Route path="/register" element={<Register />} />

//         <Route path="/home" element={
//           <PrivateRoute>
//             <h2 style={{ padding: "30px" }}>🏠 Home Page</h2>
//           </PrivateRoute>
//         } />

//         <Route path="/backtest" element={
//           <PrivateRoute>
//             <BacktestForm pendingForm={pendingForm}/>
//           </PrivateRoute>
//         } />

//         <Route path="/strategies" element={
//           <PrivateRoute>
//             <MyStrategies setForm={setPendingForm}/>
//           </PrivateRoute>
//         } />  
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

  const [pendingForm, setPendingForm] = useState(null)
  const [loadedStrategy, setLoadedStrategy] = useState(null) // { name, index }

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