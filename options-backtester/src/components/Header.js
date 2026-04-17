// import React, { useState } from "react"
import React, { useState, useRef, useEffect } from "react"
import { NavLink } from "react-router-dom"
import "./Header.css"

function Header({ onLogout }) {

  const [showDropdown, setShowDropdown] = useState(false)

  const dropdownRef = useRef(null)

  const firstName = sessionStorage.getItem("first_name") || ""
  const lastName = sessionStorage.getItem("last_name") || ""

  const initials =
    firstName.charAt(0).toUpperCase() +
    lastName.charAt(0).toUpperCase()

  useEffect(() => {

    const handleClickOutside = (event) => {

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
      }

    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }

  }, [])

  return (

    <div className="header">

      {/* <div className="logo">
        BacktestPro
      </div> */}
      <div className="logo">
        <svg width="760" height="160" viewBox="0 0 560 160" xmlns="http://www.w3.org/2000/svg" style={{ width: "180px", height: "auto", display: "block" }}>
          <g transform="translate(-120,-30) scale(2.5)">
            <path d="M15 55 C25 35, 45 35, 55 55 C65 75, 85 75, 75 50 C65 25, 45 25, 35 50 C25 75, 5 75, 15 55"
              fill="none" stroke="#1a9e5a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="35" cy="50" r="3.5" fill="#ffffff" />
            <circle cx="75" cy="50" r="3.5" fill="#ffffff" />
          </g>
          <text x="120" y="100"
            font-family="Inter, Segoe UI, Arial"
            font-size="80"
            fill="#ffffff"
            font-weight="700"
            letter-spacing="1">
            Backtest<tspan fill="#1a9e5a">Pro</tspan>
          </text>

          <text x="120" y="150"
            font-family="Inter, Segoe UI, Arial"
            font-size="28"
            fill="rgba(255,255,255,0.7)">
            Continuous Strategy Optimization
          </text>
        </svg>
      </div>

      <div className="nav">

        <NavLink to="/home" className="nav-btn">
          Home
        </NavLink>

        <NavLink to="/backtest" className="nav-btn">
          Backtest
        </NavLink>

        <NavLink to="/strategies" className="nav-btn">
          My Strategies
        </NavLink>

        <div className="profile-container" ref={dropdownRef}>

          <div
            className="profile-circle"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {initials}
          </div>

          {showDropdown && (
            <div className="dropdown">

              <div className="dropdown-header">

                <div className="profile-circle big">
                  {initials}
                </div>

                <div className="user-info">
                  <p className="user-name">
                    {firstName} {lastName}
                  </p>
                </div>

              </div>

              <hr />

              <div className="dropdown-actions">

                <button className="logout-btn" onClick={onLogout}>
                  Logout
                </button>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>

  )
}

export default Header