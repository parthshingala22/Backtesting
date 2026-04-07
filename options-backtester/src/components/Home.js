import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const firstName = sessionStorage.getItem("first_name") || "Trader";

  return (
    <div className="home-container">

      <div className="home-hero">
        <h1>👋 Welcome, {firstName}</h1>
        <p>
          Analyze your trading strategies, run backtests, and improve performance using AI.
        </p>

        <div className="home-buttons">
          <button onClick={() => navigate("/backtest")}>
            🚀 Run Backtest
          </button>

          <button onClick={() => navigate("/strategies")}>
            📂 View Strategies
          </button>
        </div>
      </div>

      <div className="home-features">

        <div className="feature-card">
          <h3>📊 Backtesting</h3>
          <p>Test your strategies on historical data with detailed reports.</p>
        </div>

        <div className="feature-card">
          <h3>🤖 AI Chatbot</h3>
          <p>Ask questions and get insights about your strategy performance.</p>
        </div>

        <div className="feature-card">
          <h3>⚡ Optimization</h3>
          <p>Improve your strategy using smart suggestions.</p>
        </div>

      </div>

    </div>
  );
}

export default Home;