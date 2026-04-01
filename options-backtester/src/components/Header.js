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

      <div className="logo">
        Options Backtester
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