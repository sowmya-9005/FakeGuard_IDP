import React, { useEffect, useState, useCallback } from "react";
import api from "../api";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("All");
  const [search, setSearch]   = useState("");

  const fetchHistory = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filter !== "All") params.filter = filter;
    if (search.trim()) params.search = search.trim();
    api.get("/api/history", { params })
      .then(r => setHistory(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(fetchHistory, 300);
    return () => clearTimeout(t);
  }, [fetchHistory]);

  const filterBtnClass = (f) => {
    if (filter !== f) return "filter-btn";
    if (f === "Fake") return "filter-btn active-fake";
    if (f === "True") return "filter-btn active-true";
    return "filter-btn active";
  };

  return (
    <div>
      <div className="history-controls">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="history-search"
            placeholder="Search articles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {["All", "Fake", "True"].map(f => (
          <button key={f} className={filterBtnClass(f)} onClick={() => setFilter(f)}>
            {f === "All" ? "All" : f === "Fake" ? "🚨 Fake" : "✅ Real"}
          </button>
        ))}
      </div>

      {!loading && history.length > 0 && (
        <div className="history-count">{history.length} result{history.length !== 1 ? "s" : ""}</div>
      )}

      {loading ? (
        <div className="empty"><div className="empty-icon">⏳</div>Loading...</div>
      ) : history.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📭</div>
          No predictions found.
        </div>
      ) : (
        <div className="history-list">
          {history.map(item => (
            <div key={item._id} className="history-item">
              <div className="history-left">
                <div className="history-text">{item.text}</div>
                <div className="history-meta">
                  <span className="history-time">🕒 {timeAgo(item.createdAt)}</span>
                </div>
              </div>
              <div className="history-right">
                <span className={`badge ${item.prediction.toLowerCase()}`}>
                  {item.prediction === "Fake" ? "🚨 Fake" : "✅ Real"}
                </span>
                {item.confidence != null && (
                  <span className="badge-conf">{item.confidence}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
