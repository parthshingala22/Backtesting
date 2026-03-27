import React, { useState } from "react";
import "./BacktestForm.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js"

import { Line } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
)

function BacktestForm() {

  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    start_date: 220101,
    end_date: 220131,
    index: "NIFTY",
    interval: "1min",
    indicators: [],
    entry_time: "09:15",
    exit_time: "10:15",
    // entry_start_time: "09:15",
    // entry_end_time: "10:15",
    // exit_time: "15:15",
    strike_mode: "Strike Type",
    strike_criteria: "ATM",
    premium: null,
    stop_loss_in_pct: 10,
    target_in_pct: 20,
    quantity: 10
  })

  const [results, setResults] = useState([])

  const [currentPage, setCurrentPage] = useState(1)
  const [startPage, setStartPage] = useState(1)

  const tradesPerPage = 10
  const visiblePages = 5

  const handleChange = (e) => {

    let { name, value, type } = e.target

    if (name === "start_date" || name === "end_date") {

      const date = new Date(value)

      const year = String(date.getFullYear()).slice(2)
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")

      value = Number(year + month + day)
    }

    if (type === "number") {
      value = Number(value)
    }

    setForm({ ...form, [name]: value })
  }


  const runBacktest = async () => {

    try {

      setLoading(true)

      const payload = { ...form }
      delete payload.strike_mode

      // const token = localStorage.getItem("token")
      const token = sessionStorage.getItem("token")

      const response = await fetch("http://localhost:5000/backtest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })


      const data = await response.json()

      console.log("Backtest result:", data)

      setResults(data)

    } catch (error) {

      console.error(error)

    } finally {

      setLoading(false)

    }

  }


  const totalTrades = results.length

  const winTrades = results.filter(
    trade => trade.Profit_n_Loss > 0
  ).length

  const lossTrades = results.filter(
    trade => trade.Profit_n_Loss <= 0
  ).length

  const totalPnL = results.reduce(
    (sum, trade) => sum + trade.Profit_n_Loss, 0
  )

  const winRate = totalTrades
    ? ((winTrades / totalTrades) * 100).toFixed(2)
    : 0

  const grossProfit = results
    .filter(t => t.Profit_n_Loss > 0)
    .reduce((sum, t) => sum + t.Profit_n_Loss, 0)

  const grossLoss = results
    .filter(t => t.Profit_n_Loss < 0)
    .reduce((sum, t) => sum + Math.abs(t.Profit_n_Loss), 0)

  const profitFactor = grossLoss
    ? (grossProfit / grossLoss).toFixed(2)
    : 0


  let equity = 0
  let peak = 0
  let maxDrawdown = 0

  results.forEach(trade => {

    equity += trade.Profit_n_Loss

    if (equity > peak) {
      peak = equity
    }

    const drawdown = peak - equity

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }

  })



  const downloadReport = () => {

    if (results.length === 0) {
      alert("No report available")
      return
    }

    const columns = [
      "Date",
      "Symbol",
      "Buy_Price",
      "Sell_Price",
      "Entry_Time",
      "Exit_Time",
      "Profit_n_Loss",
      "Exit_Reason"
    ]

    const csvRows = []

    csvRows.push(columns.join(","))

    results.forEach(row => {

      const values = columns.map(col => row[col])

      csvRows.push(values.join(","))

    })

    const csvString = csvRows.join("\n")

    const blob = new Blob([csvString], { type: "text/csv" })

    const url = window.URL.createObjectURL(blob)

    const a = document.createElement("a")

    a.href = url
    a.download = "backtest_report.csv"

    a.click()

  }

  let equity1 = 0

  const equityData = results.map((trade) => {

    equity1 += Number(trade.Profit_n_Loss)

    return equity1

  })

  const chartData = {
    labels: results.map((_, index) => index + 1),
    datasets: [
      {
        label: "Equity Curve",
        data: equityData,
        borderColor: "#3498db",
        backgroundColor: "rgba(52,152,219,0.2)",
        tension: 0.3
      }
    ]
  }


  const indexOfLastTrade = currentPage * tradesPerPage
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage

  const currentTrades = results.slice(indexOfFirstTrade, indexOfLastTrade)

  const totalPages = Math.ceil(results.length / tradesPerPage)

  const pageNumbers = []

  for (
    let i = startPage;
    i < startPage + visiblePages && i <= totalPages;
    i++
  ) {
    pageNumbers.push(i)
  }

  const goNextPage = () => {

    if (currentPage < totalPages) {

      setCurrentPage(currentPage + 1)

      if (currentPage >= startPage + visiblePages - 1) {
        setStartPage(startPage + 1)
      }

    }

  }

  const goPrevPage = () => {

    if (currentPage > 1) {

      setCurrentPage(currentPage - 1)

      if (currentPage <= startPage) {
        setStartPage(startPage - 1)
      }

    }

  }

  const goFirst = () => {

    setCurrentPage(1)
    setStartPage(1)

  }

  const goLast = () => {

    const lastStart = Math.max(totalPages - visiblePages + 1, 1)

    setCurrentPage(totalPages)
    setStartPage(lastStart)

  }



  return (

    <div className="container">

      {loading && (

        <div className="loading-overlay">

          <div className="spinner"></div>
          <p>Running Backtest...</p>

        </div>

      )}
      <div>

        <h3>📅 Backtest Period</h3>

        <h6>Start Date</h6>
        <input type="date" name="start_date" defaultValue="2022-01-01" onChange={handleChange} />
        <h6>End Date</h6>
        <input type="date" name="end_date" defaultValue="2022-01-31" onChange={handleChange} />

        <h3>📊 Market Settings</h3>

        <h6>Index</h6>
        <select name="index" onChange={handleChange}>
          <option>NIFTY</option>
          <option>BANKNIFTY</option>
          <option>MCX</option>
        </select>

        <h6>Interval</h6>
        <select name="interval" onChange={handleChange}>
          <option>1min</option>
          <option>3min</option>
          <option>5min</option>
          <option>15min</option>
        </select>


        <h3>Indicators</h3>

        <select
          onChange={(e) => {

            const value = e.target.value

            if (value === "") return

            if (!form.indicators.includes(value)) {
              setForm({
                ...form,
                indicators: [...form.indicators, value]
              })
            }

            e.target.value = ""

          }}
        >

          <option value="">Select Indicator</option>
          <option value="rsi">RSI</option>
          <option value="bullish_n_bearish_engulfing">Engulfing</option>

        </select>


        <div className="indicator-bucket">

          {form.indicators.map((indicator, index) => (

            <div className="indicator-tag" key={index}>

              {indicator === "rsi" ? "RSI" : "Engulfing"}

              <span
                onClick={() => {
                  setForm({
                    ...form,
                    indicators: form.indicators.filter(i => i !== indicator)
                  })
                }}
              >
                ✕
              </span>

            </div>

          ))}

        </div>



        <h3>⏰ Trade Entry</h3>

        <div className="time-row">

          <div>
            <h6>Entry Time</h6>
            <input type="time" name="entry_time" value={form.entry_time} onChange={handleChange} />
          </div>

          <div>
            <h6>Exit Time</h6>
            <input type="time" name="exit_time" value={form.exit_time} onChange={handleChange} />
          </div>

        </div>

        <h3>📌 Strike Criteria</h3>

        <h6>Strike Criteria</h6>
        <select
          name="strike_mode"
          value={form.strike_mode}
          onChange={(e) => {
            const value = e.target.value

            setForm({
              ...form,
              strike_mode: value,
              strike_criteria: value === "Strike Type" ? "ATM" : "premium",
              premium: value === "Premium Based" ? 250 : null
            })
          }}
        >
          <option>Strike Type</option>
          <option>Premium Based</option>
        </select>


        {form.strike_mode === "Strike Type" ? (

          <select
            name="strike_criteria"
            value={form.strike_criteria}
            onChange={handleChange}
          >
            <option value="ATM">ATM</option>
            <option value="ITM">ITM</option>
            <option value="OTM">OTM</option>
          </select>

        ) : (

          <input
            type="number"
            name="premium"
            placeholder="Enter Premium"
            value={form.premium || ""}
            onChange={handleChange}
          />

        )}


        <h3>⚠ Risk Management</h3>

        <h6>Stop Loss</h6>
        <input
          type="number"
          name="stop_loss_in_pct"
          value={form.stop_loss_in_pct}
          onChange={handleChange}
        />

        <h6>Target</h6>
        <input
          type="number"
          name="target_in_pct"
          value={form.target_in_pct}
          onChange={handleChange}
        />


        <h3>📦 Position Size</h3>

        <h6>Lot Quantity</h6>
        <input
          type="number"
          name="quantity"
          value={form.quantity}
          onChange={handleChange}
        />

        <br /><br />

        <button onClick={runBacktest}>
          🚀 Run Backtest
        </button>


        {results.length > 0 && (

          <div className="report-chart-container">

            <div className="strategy-report">

              <h2>Strategy Report</h2>

              <div className="report-row">
                <span>Total PnL</span>
                <span className={totalPnL >= 0 ? "profit" : "loss"}>
                  ₹ {totalPnL.toFixed(2)}
                </span>
              </div>

              <div className="report-row">
                <span>Total Trades</span>
                <span>{totalTrades}</span>
              </div>

              <div className="report-row">
                <span>Win Trades</span>
                <span className="profit">{winTrades}</span>
              </div>

              <div className="report-row">
                <span>Loss Trades</span>
                <span className="loss">{lossTrades}</span>
              </div>

              <div className="report-row">
                <span>Win Rate</span>
                <span>{winRate}%</span>
              </div>

              <div className="report-row">
                <span>Profit Factor</span>
                <span>{profitFactor}</span>
              </div>

              <div className="report-row">
                <span>Max Drawdown</span>
                <span className="loss">₹ {maxDrawdown.toFixed(2)}</span>
              </div>

            </div>


            <div className="equity-chart">

              <h2>Equity Curve</h2>

              <Line data={chartData} />

            </div>

          </div>

        )}

        {results.length > 0 && (

          <div className="results-section">

            <h2>📊 Trade Results</h2>

            <table className="results-table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Symbol</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Buy Price</th>
                  <th>Sell Price</th>
                  <th>PnL</th>
                  <th>Exit Reason</th>
                </tr>
              </thead>

              <tbody>

                {currentTrades.map((trade, index) => (

                  <tr key={index}>

                    <td>{trade.Date}</td>
                    <td>{trade.Symbol}</td>
                    <td>{trade.Entry_Time}</td>
                    <td>{trade.Exit_Time}</td>
                    <td>{trade.Buy_Price}</td>
                    <td>{trade.Sell_Price}</td>

                    <td
                      className={
                        trade.Profit_n_Loss >= 0
                          ? "profit-green"
                          : "loss-red"
                      }
                    >
                      {trade.Profit_n_Loss}
                    </td>

                    <td>{trade.Exit_Reason}</td>

                  </tr>

                ))}

              </tbody>

            </table>



            <div className="table-footer">

              <button
                onClick={downloadReport}
                className="download-btn"
              >
                Download Report
              </button>


              <div className="pagination-container">

                <button onClick={goFirst}>«</button>

                <button onClick={goPrevPage}>‹</button>

                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    className={
                      currentPage === page
                        ? "active-page"
                        : ""
                    }
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button onClick={goNextPage}>›</button>

                <button onClick={goLast}>»</button>

              </div>

            </div>

          </div>

        )}


      </div>

    </div>
  )

}

export default BacktestForm