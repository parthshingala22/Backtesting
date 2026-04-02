import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./MyStrategies.css"

function MyStrategies({ setForm, setLoadedStrategy }) {

  const [strategies, setStrategies] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("strategies")) || []
    setStrategies(data)
  }, [])

  const loadStrategy = (strategy, index) => {
    setForm(strategy.formData)
    setLoadedStrategy({ name: strategy.name, index })
    navigate("/backtest")
  }

  const deleteStrategy = (index) => {
    const updated = strategies.filter((_, i) => i !== index)
    setStrategies(updated)
    localStorage.setItem("strategies", JSON.stringify(updated))
  }

  return (
    <div className="strategies-page">

      <div className="strategies-header">
        <h2>📂 My Strategies</h2>
        <span className="strategies-count">{strategies.length} saved</span>
      </div>

      {strategies.length === 0 ? (

        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No strategies yet</h3>
          <p>Run a backtest and save your first strategy</p>
          <button className="go-backtest-btn" onClick={() => navigate("/backtest")}>
            Go to Backtest
          </button>
        </div>

      ) : (

        <div className="strategies-list">

          {strategies.map((s, index) => (

            <div className="strategy-card" key={index}>

              <div className="strategy-card-left" onClick={() => loadStrategy(s, index)}>
                <div className="strategy-icon">📈</div>
                <div className="strategy-info">
                  <strong className="strategy-name">{s.name}</strong>
                  <div className="strategy-meta">
                    <span>📅 {s.formData.start_date} → {s.formData.end_date}</span>
                    <span>📊 {s.formData.index}</span>
                    <span>⏱ {s.formData.interval}</span>
                  </div>
                </div>
              </div>

              <div className="strategy-card-right">
                <button
                  className="load-btn"
                  onClick={() => loadStrategy(s, index)}
                >
                  Load
                </button>
                <button
                  className="delete-btn"
                  onClick={() => deleteStrategy(index)}
                >
                  🗑 Delete
                </button>
              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  )
}

export default MyStrategies