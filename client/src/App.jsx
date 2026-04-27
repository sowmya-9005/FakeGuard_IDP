import React, { useState, useEffect } from "react";
import Detector from "./components/Detector";
import History from "./components/History";
import Stats from "./components/Stats";

export default function App() {
  const [tab, setTab] = useState("detect");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const tabs = [
    { id: "detect",  label: "🔍 Detect" },
    { id: "stats",   label: "📊 Stats" },
    { id: "history", label: "🕒 History" },
  ];

  return (
    <div className="container">
      <div className="header">
        <div className="logo">
          <div className="logo-icon">🛡️</div>
          <h1>FakeGuard</h1>
        </div>
        <div className="header-right">
          <span className="accuracy-badge">98.9% Accuracy</span>
          <button
            className="theme-toggle"
            onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
      <p className="subtitle">AI-powered fake news detection using Stacking Ensemble ML</p>

      <div className="tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "detect"  && <Detector />}
      {tab === "stats"   && <Stats />}
      {tab === "history" && <History />}
    </div>
  );
}
