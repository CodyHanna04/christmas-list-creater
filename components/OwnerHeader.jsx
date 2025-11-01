// components/OwnerHeader.jsx
"use client";
import { auth } from "@/services/firebase";

export default function OwnerHeader({ title, url }) {
  return (
    <div className="owner-header">
      <div>
        <h2>{title}</h2>
        <div className="muted">
          Public link: <a href={`/l/${url}`} target="_blank">{`/l/${url}`}</a>
        </div>
      </div>
      <div className="grow" />
      <button onClick={() => auth.signOut()}>Sign out</button>
    </div>
  );
}
