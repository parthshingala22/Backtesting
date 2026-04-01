import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function MyStrategies({ setForm }) {

  const [strategies, setStrategies] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("strategies")) || []
    setStrategies(data)
  }, [])

  const loadStrategy = (strategy) => {
    setForm(strategy.formData)
    navigate("/backtest") // 🔥 redirect
  }

  return (

    <div style={{ padding: "30px" }}>

      <h2>📂 My Strategies</h2>

      {strategies.length === 0 && (
        <p>No strategies saved yet</p>
      )}

      {strategies.map((s, index) => (

        <div
          key={index}
          style={{
            padding: "15px",
            border: "1px solid #ddd",
            marginBottom: "10px",
            borderRadius: "8px",
            cursor: "pointer"
          }}
          onClick={() => loadStrategy(s)}
        >
          <strong>{s.name}</strong>
        </div>

      ))}

    </div>

  )
}

export default MyStrategies