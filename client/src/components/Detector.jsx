import React, { useState } from "react";
import api from "../api";
import { exportPDF } from "../utils/exportPDF";

const MAX_CHARS = 5000;

function Skeleton() {
  return (
    <div className="skeleton">
      <div className="skeleton-line short" />
      <div className="skeleton-line medium" />
      <div className="skeleton-line" />
      <div className="skeleton-line medium" />
      <div className="skeleton-line short" />
    </div>
  );
}

export default function Detector() {
  const [text, setText]     = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/api/predict", { text });
      setResult(res.data);
    } catch {
      setError("Something went wrong. Make sure all services are running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const out = `FakeGuard Result\n─────────────────\nVerdict: ${result.prediction}\nConfidence: ${result.confidence}%\nTop Keywords: ${result.keywords?.map(k => k.word).join(", ")}\n\nArticle:\n${text}`;
    navigator.clipboard.writeText(out);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    if (!result) return;
    setExporting(true);
    setTimeout(() => {
      exportPDF({ text, prediction: result.prediction, confidence: result.confidence, keywords: result.keywords });
      setExporting(false);
    }, 100);
  };

  const handleClear = () => { setText(""); setResult(null); setError(""); };

  const cls = result?.prediction?.toLowerCase();

  return (
    <div>
      <div className="card">
        <div className="input-section">
          <div className="input-header">
            <span className="input-label">News Article or Headline</span>
            <span className={`char-count ${charCount > MAX_CHARS * 0.9 ? "warn" : ""}`}>
              {charCount} / {MAX_CHARS}
            </span>
          </div>
          <textarea
            placeholder="Paste a news article, headline, or any text to verify..."
            value={text}
            maxLength={MAX_CHARS}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.ctrlKey && e.key === "Enter") handleSubmit(); }}
          />
          <div className="input-footer">
            <span className="word-count">{wordCount} word{wordCount !== 1 ? "s" : ""}</span>
            <div className="btn-row">
              <button className="btn-clear" onClick={handleClear} disabled={!text && !result}>
                ✕ Clear
              </button>
            </div>
          </div>
        </div>

        <button
          className="btn-analyze"
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
        >
          {loading ? "⏳ Analyzing..." : "🔍 Analyze Article  (Ctrl+Enter)"}
        </button>
      </div>

      {error && <div className="error">⚠️ {error}</div>}
      {loading && <Skeleton />}

      {result && !loading && (
        <div className={`result-card ${cls}`}>
          <div className="result-top">
            <div className="result-label">
              {cls === "fake" ? "🚨 FAKE NEWS DETECTED" : "✅ REAL NEWS"}
            </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn-copy" onClick={handleCopy}>
              {copied ? "✓ Copied" : "📋 Copy"}
            </button>
            <button className="btn-copy" onClick={handleExportPDF} disabled={exporting}>
              {exporting ? "⏳..." : "📄 PDF"}
            </button>
          </div>
          </div>

          {result.confidence != null && (
            <div className="confidence-wrap">
              <div className="confidence-header">
                <span>Confidence Score</span>
                <span style={{ fontWeight: 700 }}>{result.confidence}%</span>
              </div>
              <div className="confidence-bar-bg">
                <div className="confidence-bar-fill" style={{ width: `${result.confidence}%` }} />
              </div>
            </div>
          )}

          {result.keywords?.length > 0 && (
            <div className="keywords-section">
              <div className="keywords-title">🔑 Top Triggering Keywords</div>
              <div className="keywords-wrap">
                {result.keywords.map((k, i) => (
                  <span key={i} className="keyword-tag">{k.word}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
