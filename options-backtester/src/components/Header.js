import React from "react"
// import { Link } from "react-router-dom"
import { NavLink } from "react-router-dom"
import "./Header.css"

function Header({ onLogout }) {

  return (

    <div className="header">

      <div className="logo">
        Options Backtester
      </div>

      {/* <div className="nav">

        <Link to="/home" className="nav-btn">
          Home
        </Link>

        <Link to="/backtest" className="nav-btn">
          Backtest
        </Link>

        <Link to="/optimizer" className="nav-btn">
          Optimizer
        </Link>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>

      </div> */}

      <div className="nav">

        <NavLink to="/home" className="nav-btn">
          Home
        </NavLink>

        <NavLink to="/backtest" className="nav-btn">
          Backtest
        </NavLink>

        <NavLink to="/optimizer" className="nav-btn">
          Optimizer
        </NavLink>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>

      </div>

    </div>

  )

}

export default Header