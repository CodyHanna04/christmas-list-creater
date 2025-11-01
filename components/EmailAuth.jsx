// components/EmailAuth.jsx
"use client";
import { useState } from "react";
import { auth } from "@/services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

export default function EmailAuth() {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, pass);
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="email-auth">
      <input
        type="email"
        placeholder="email@example.com"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="password"
        value={pass}
        onChange={(e)=>setPass(e.target.value)}
        required
      />
      <button type="submit">{mode === "signup" ? "Sign up" : "Sign in"}</button>
      <button type="button" className="link" onClick={()=>setMode(mode==="signup"?"signin":"signup")}>
        {mode === "signup" ? "Have an account? Sign in" : "New here? Create account"}
      </button>
      {msg && <div className="muted">{msg}</div>}
    </form>
  );
}
