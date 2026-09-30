"use client";

import { FormEvent, useState } from "react";
import styles from "../staff.module.css";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/staff-auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please try again.");
      window.location.assign("/staff");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Please try again."); } finally { setBusy(false); }
  }
  return <form className={styles.loginForm} onSubmit={submit}><label htmlFor="staff-password">Administrator password</label><input id="staff-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" autoFocus />{error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.primaryButton} disabled={busy}>{busy ? "Please wait..." : "Sign in"}</button></form>;
}
