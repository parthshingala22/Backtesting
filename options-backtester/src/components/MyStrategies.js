// import React, { useEffect, useState, useCallback } from "react"
// import { useNavigate } from "react-router-dom"
// import "./MyStrategies.css"

// function MyStrategies({ setForm, setLoadedStrategy }) {

//   const [strategies, setStrategies] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [deletePopup, setDeletePopup] = useState({ show: false, id: null, name: "" })
//   const navigate = useNavigate()
//   const token = sessionStorage.getItem("token")

//   const fetchStrategies = useCallback(async () => {
//     try {
//       setLoading(true)
//       const response = await fetch("http://localhost:5000/strategies", {
//         headers: {
//           "Authorization": `Bearer ${token}`
//         }
//       })
//       const data = await response.json()
//       setStrategies(data)
//     } catch (error) {
//       console.error("Failed to load strategies:", error)
//     } finally {
//       setLoading(false)
//     }
//   }, [token])

//   useEffect(() => {
//     fetchStrategies()
//   }, [fetchStrategies])

//   const loadStrategy = (strategy) => {
//     setForm(strategy.formData)
//     setLoadedStrategy({ name: strategy.name, id: strategy.id })
//     navigate("/backtest")
//   }

//   const confirmDelete = (id, name) => {
//     setDeletePopup({ show: true, id, name })
//   }

//   const deleteStrategy = async () => {
//     const { id } = deletePopup
//     try {
//       await fetch(`http://localhost:5000/strategies/${id}`, {
//         method: "DELETE",
//         headers: {
//           "Authorization": `Bearer ${token}`
//         }
//       })
//       setStrategies(strategies.filter(s => s.id !== id))
//     } catch (error) {
//       console.error("Failed to delete strategy:", error)
//     } finally {
//       setDeletePopup({ show: false, id: null, name: "" })
//     }
//   }

//   if (loading) {
//     return (
//       <div className="strategies-page">
//         <p>Loading strategies...</p>
//       </div>
//     )
//   }

//   return (
//     <div className="strategies-page">

//       <div className="strategies-header">
//         <h2>📂 My Strategies</h2>
//         <span className="strategies-count">{strategies.length} saved</span>
//       </div>

//       {strategies.length === 0 ? (

//         <div className="empty-state">
//           <div className="empty-icon">📭</div>
//           <h3>No strategies yet</h3>
//           <p>Run a backtest and save your first strategy</p>
//           <button className="go-backtest-btn" onClick={() => navigate("/backtest")}>
//             Go to Backtest
//           </button>
//         </div>

//       ) : (

//         <div className="strategies-list">
//           {strategies.map((s) => (
//             <div className="strategy-card" key={s.id}>

//               <div className="strategy-card-left" onClick={() => loadStrategy(s)}>
//                 <div className="strategy-icon">📈</div>
//                 <div className="strategy-info">
//                   <strong className="strategy-name">{s.name}</strong>
//                   <div className="strategy-meta">
//                     <span>📅 {s.formData.start_date} → {s.formData.end_date}</span>
//                     <span>📊 {s.formData.index}</span>
//                     <span>⏱ {s.formData.interval}</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="strategy-card-right">
//                 <button className="load-btn" onClick={() => loadStrategy(s)}>
//                   Load
//                 </button>
//                 <button className="delete-btn" onClick={() => confirmDelete(s.id, s.name)}>
//                   🗑 Delete
//                 </button>
//               </div>

//             </div>
//           ))}
//         </div>

//       )}

//       {/* Delete Confirmation Popup */}
//       {deletePopup.show && (

//         <div className="popup-overlay">

//           <div className="popup">

//             <div className="popup-header">
//               <h3 className="popup-header-name">Delete Strategy</h3>
//               <span className="popup-close-tag" onClick={() => setDeletePopup({ show: false, id: null, name: "" })}>✕</span>
//             </div>

//             <hr />

//             <div className="strategy-name-container">
//               <p className="strategy-name-label">
//                 Are you sure you want to delete &nbsp;<strong> "{deletePopup.name}"</strong>?
//               </p>
//               <p style={{ fontSize: "13px", color: "#888", marginTop: "6px" }}>
//                 This action cannot be undone.
//               </p>
//             </div>

//             <div className="popup-actions">

//               <button className="popup-btn" onClick={() => setDeletePopup({ show: false, id: null, name: "" })}>
//                 Cancel
//               </button>

//               <button className="popup-btn" style={{ background: "#e74c3c", color: "#fff" }} onClick={deleteStrategy}>
//                 Delete
//               </button>

//             </div>

//           </div>

//         </div>

//       )}

//     </div>
//   )
// }

// export default MyStrategies

import React, { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import "./MyStrategies.css"

function MyStrategies({ setForm, setLoadedStrategy }) {

  const [strategies, setStrategies] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletePopup, setDeletePopup] = useState({ show: false, id: null, name: "" })
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })
  const navigate = useNavigate()
  const token = sessionStorage.getItem("token")

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" })
    }, 3000)
  }

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

  const confirmDelete = (id, name) => {
    setDeletePopup({ show: true, id, name })
  }

  const deleteStrategy = async () => {
    const { id } = deletePopup
    setDeletePopup({ show: false, id: null, name: "" })
    try {
      await fetch(`http://localhost:5000/strategies/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      setStrategies(strategies.filter(s => s.id !== id))
      showToast("Strategy deleted successfully")
    } catch (error) {
      console.error("Failed to delete strategy:", error)
      showToast("Failed to delete strategy", "error")
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
                <button className="delete-btn" onClick={() => confirmDelete(s.id, s.name)}>
                  🗑 Delete
                </button>
              </div>

            </div>
          ))}
        </div>

      )}

      {/* Delete Confirmation Popup */}
      {deletePopup.show && (

        <div className="popup-overlay">

          <div className="popup">

            <div className="popup-header">
              <h3 className="popup-header-name">Delete Strategy</h3>
              <span className="popup-close-tag" onClick={() => setDeletePopup({ show: false, id: null, name: "" })}>✕</span>
            </div>

            <hr />

            <div className="strategy-name-container">
              <p className="strategy-name-label">
                Are you sure you want to delete &nbsp;<strong>"{deletePopup.name}"</strong> &nbsp;strategy?
              </p>
              <p style={{ fontSize: "13px", color: "#888", marginTop: "6px" }}>
                This action cannot be undone.
              </p>
            </div>

            <div className="popup-actions">

              <button className="popup-btn" onClick={() => setDeletePopup({ show: false, id: null, name: "" })}>
                Cancel
              </button>

              <button className="popup-btn" style={{ background: "#e74c3c", color: "#fff" }} onClick={deleteStrategy}>
                Delete
              </button>

            </div>

          </div>

        </div>

      )}

      {/* Toast - same as BacktestForm */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast({ ...toast, show: false })}>✕</button>
        </div>
      )}

    </div>
  )
}

export default MyStrategies