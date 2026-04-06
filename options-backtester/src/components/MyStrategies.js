import React, { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import "./MyStrategies.css"

function MyStrategies({ setForm, setLoadedStrategy }) {

  const [strategies, setStrategies] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const token = sessionStorage.getItem("token")

  const fetchStrategies = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:5000/strategies", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      const data = await response.json()
      setStrategies(data)
    } catch (error) {
      console.error("Failed to load strategies:", error)
    } finally {
      setLoading(false)
    }
  }, [token]) 

  useEffect(() => {
    fetchStrategies()
  }, [fetchStrategies])

  const loadStrategy = (strategy) => {
    setForm(strategy.formData)
    setLoadedStrategy({ name: strategy.name, id: strategy.id })
    navigate("/backtest")
  }

  const deleteStrategy = async (id) => {
    try {
      await fetch(`http://localhost:5000/strategies/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      setStrategies(strategies.filter(s => s.id !== id))
    } catch (error) {
      console.error("Failed to delete strategy:", error)
    }
  }

  if (loading) {
    return (
      <div className="strategies-page">
        <p>Loading strategies...</p>
      </div>
    )
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
          {strategies.map((s) => (
            <div className="strategy-card" key={s.id}>

              <div className="strategy-card-left" onClick={() => loadStrategy(s)}>
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
                <button className="load-btn" onClick={() => loadStrategy(s)}>
                  Load
                </button>
                <button className="delete-btn" onClick={() => deleteStrategy(s.id)}>
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