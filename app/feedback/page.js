"use client";
import { useEffect, useMemo, useState } from "react";
import { db, auth } from "@/services/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const FEEDBACK_TYPES = [
  { value: "bug", label: "🐞 Bug report" },
  { value: "feature", label: "🌟 Feature request" },
  { value: "ui", label: "🎨 UI/UX issue" },
  { value: "copy", label: "✍️ Text/Copy fix" },
  { value: "other", label: "📝 Other" },
];

const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function FeedbackPage() {
  const [type, setType] = useState("bug");
  const [severity, setSeverity] = useState("medium");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  // auto-capture current page
  const pageUrl = useMemo(
    () => (typeof window !== "undefined" ? window.location.href : ""),
    []
  );

  // simple honeypot to deter bots
  const [hp, setHp] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setMsg("");
    setOk(false);

    // very light validation
    if (!summary.trim()) {
      setMsg("Please add a brief summary.");
      return;
    }
    if (hp.trim()) {
      setMsg("Submission blocked."); // honeypot tripped
      return;
    }

    setBusy(true);
    try {
      const u = auth.currentUser;
      await addDoc(collection(db, "feedback"), {
        type,
        severity,
        summary: summary.trim(),
        details: details.trim(),
        steps: steps.trim(),
        expected: expected.trim(),
        actual: actual.trim(),
        pageUrl,
        contactName: contactName.trim() || null,
        contactEmail: contactEmail.trim() || null,
        consent: !!consent,
        userUid: u ? u.uid : null,
        userIsAnon: u ? !!u.isAnonymous : null,
        userEmail: u?.email || null,
        createdAt: serverTimestamp(),
        status: "new", // for triage later
      });
      setOk(true);
      setMsg("Thanks! Your feedback was submitted. 🎉");
      // reset most fields but keep contact info for convenience
      setSummary("");
      setDetails("");
      setSteps("");
      setExpected("");
      setActual("");
      setSeverity("medium");
      setType("bug");
    } catch (err) {
      setMsg(err?.message || "Could not submit feedback.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="panel">
        <h1>Feedback</h1>
        <p className="muted">Tell me what to fix or build next. I read every submission!</p>

        <form onSubmit={onSubmit} className="stack spacious-grid">
          {/* Honeypot */}
          <input
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            placeholder="Leave this blank"
          />

          <div className="row wrap">
            <div className="grow">
              <label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {FEEDBACK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div style={{ width: 140 }}>
              <label>Severity</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                {SEVERITIES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label>Brief summary *</label>
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One sentence that sums it up"
              required
              disabled={busy}
            />
          </div>

          <div>
            <label>Details</label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Tell me what you saw, browser/device, etc."
              disabled={busy}
            />
          </div>

          {type === "bug" && (
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <label>Steps to reproduce</label>
                <textarea
                  rows={4}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="1) Go to...  2) Click...  3) See error..."
                  disabled={busy}
                />
              </div>
              <div>
                <label>Expected vs Actual</label>
                <textarea
                  rows={4}
                  value={expected}
                  onChange={(e) => setExpected(e.target.value)}
                  placeholder="What you expected to happen"
                  disabled={busy}
                />
                <textarea
                  rows={4}
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  placeholder="What actually happened"
                  disabled={busy}
                  style={{ marginTop: 8 }}
                />
              </div>
            </div>
          )}

          <div className="row wrap">
            <div className="grow">
              <label>Contact name (optional)</label>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="So I can follow up"
                disabled={busy}
              />
            </div>
            <div className="grow">
              <label>Email (optional)</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={busy}
              />
            </div>
          </div>

          <div className="row wrap" style={{ alignItems: "center" }}>
            <span className="muted grow">Page: {pageUrl || "unknown"}</span>
            <label className="row" style={{ gap: 8 }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={busy}
              />
              <span className="muted">Allow contact if needed</span>
            </label>
          </div>

          <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
            <button type="submit" disabled={busy}>
              {busy ? "Submitting…" : "Submit Feedback"}
            </button>
          </div>

          {msg && (
            <div className="muted" style={{ marginTop: 4 }}>
              {ok ? "✅ " : "⚠️ "}{msg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
