import React, { useEffect, useState } from "react";
import api from "../api";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Stats() {
  const [stats, setStats]       = useState(null);
  const [recent, setRecent]     = useState([]);

  useEffect(() => {
    api.get("/api/stats").then(r => setStats(r.data)).catch(() => {});
    api.get("/api/history?limit=6").then(r => setRecent(r.data.slice(0, 6))).catch(() => {});
  }, []);

  if (!stats) return (
    <div className="empty"><div className="empty-icon">📊</div>Loading stats...</div>
  );

  const fakePercent = stats.total ? Math.round((stats.fakeCount / stats.total) * 100) : 0;
  const truePercent = stats.total ? Math.round((stats.trueCount / stats.total) * 100) : 0;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📰</div>
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Analyzed</div>
        </div>
        <div className="stat-card fake-stat">
          <div className="stat-icon">🚨</div>
          <div className="stat-number">{stats.fakeCount}</div>
          <div className="stat-label">Fake Detected</div>
        </div>
        <div className="stat-card true-stat">
          <div className="stat-icon">✅</div>
          <div className="stat-number">{stats.trueCount}</div>
          <div className="stat-label">Real News</div>
        </div>
      </div>

      <div className="chart-bar-wrap">
        <div className="section-title">Distribution</div>
        <div className="chart-row">
          <span className="chart-label">Fake</span>
          <div className="chart-bg">
            <div className="chart-fill fake" style={{ width: `${fakePercent}%` }}>
              {fakePercent > 10 ? `${fakePercent}%` : ""}
            </div>
          </div>
          <span className="chart-pct">{fakePercent}%</span>
        </div>
        <div className="chart-row">
          <span className="chart-label">Real</span>
          <div className="chart-bg">
            <div className="chart-fill true" style={{ width: `${truePercent}%` }}>
              {truePercent > 10 ? `${truePercent}%` : ""}
            </div>
          </div>
          <span className="chart-pct">{truePercent}%</span>
        </div>
      </div>

      {recent.length > 0 && (
        <div>
          <div className="section-title">Recent Activity</div>
          <div className="activity-list">
            {recent.map(item => (
              <div key={item._id} className="activity-item">
                <div className={`activity-dot ${item.prediction.toLowerCase()}`} />
                <span className="activity-text">{item.text}</span>
                <span className="activity-time">{timeAgo(item.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
