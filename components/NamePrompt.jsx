// components/NamePrompt.jsx
"use client";
import { useEffect, useState } from "react";

export default function NamePrompt({ initial, onSave }) {
  const [name, setName] = useState(initial || "");

  useEffect(() => {
    if (initial) setName(initial);
  }, [initial]);

  return (
    <div className="modal">
      <div className="modal-card">
        <h3>What’s your name?</h3>
        <p>We’ll remember this on this browser for future visits.</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Aunt Joan"
        />
        <div className="row">
          <button onClick={() => onSave(name)} disabled={!name.trim()}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
