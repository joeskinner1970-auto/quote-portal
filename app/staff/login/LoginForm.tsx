"use client";

import { FormEvent, useState } from "react";
import styles from "../staff.module.css";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/staff-auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please try again.");
      window.location.assign("/staff");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Please try again."); } finally { setBusy(false); }
  }
  return <form className={styles.loginForm} onSubmit={submit}><label htmlFor="staff-email">Email address</label><input id="staff-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" autoFocus /><label htmlFor="staff-password">Password</label><input id="staff-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />{error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.primaryButton} disabled={busy}>{busy ? "Please wait..." : "Sign in"}</button></form>;
}
