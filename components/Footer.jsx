// components/Footer.jsx
"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-inner">
        <p>
          Created by{" "}
          <a
            href="https://codycodez.com"
            target="_blank"
            rel="noreferrer"
            className="footer-link"
          >
            Cody Codez LLC
          </a>
        </p>

        <Link href="/feedback" className="btn secondary">
          💬 Leave Feedback
        </Link>
      </div>
    </footer>
  );
}
