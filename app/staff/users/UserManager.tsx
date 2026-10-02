"use client";

import { FormEvent, useState } from "react";
import styles from "../staff.module.css";

export type PortalUser = { _id?: string; name: string; email: string; hubspotUserId?: string; role: "sales" | "management"; active: boolean; password?: string; primaryAdministrator?: boolean };
const empty: PortalUser = { name: "", email: "", hubspotUserId: "", role: "sales", active: true, password: "" };

export function UserManager({ initialUsers }: { initialUsers: PortalUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [editing, setEditing] = useState<PortalUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault(); if (!editing) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/staff-users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setUsers(current => {
        const found = current.some(user => user.email.toLowerCase() === editing.email.toLowerCase());
        const saved = { ...editing, _id: data.id };
        return (found ? current.map(user => user.email.toLowerCase() === editing.email.toLowerCase() ? saved : user) : [...current, saved]).sort((left, right) => left.name.localeCompare(right.name));
      });
      setEditing(null);
    } catch (value) { setError(value instanceof Error ? value.message : "The user could not be saved."); } finally { setBusy(false); }
  }

  async function remove(user: PortalUser) {
    if (!window.confirm(`Delete ${user.name}'s portal access? They will no longer be able to sign in.`)) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/staff-users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user._id, email: user.email }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setUsers(current => current.filter(currentUser => currentUser.email.toLowerCase() !== user.email.toLowerCase()));
    } catch (value) { setError(value instanceof Error ? value.message : "The user could not be deleted."); } finally { setBusy(false); }
  }

  return <section className={styles.userManager}>
    <button className={styles.primaryButton} onClick={() => setEditing(empty)}>Add portal user</button>
    {error && <p className={styles.error}>{error}</p>}
    <div className={styles.userList}>{users.map(user => <article key={user._id || user.email}>
      <div><strong>{user.name}</strong><span>{user.email}</span>{user.primaryAdministrator && <span>Primary administrator</span>}{user.hubspotUserId && <span>HubSpot User ID: {user.hubspotUserId}</span>}</div>
      <span className={styles.statusBadge}>{user.role === "management" ? "Management" : "Sales"}</span>
      <span className={`${styles.statusBadge} ${user.active ? styles.status_accepted : styles.status_superseded}`}>{user.active ? "Active" : "Disabled"}</span>
      <button onClick={() => setEditing({ ...user, password: "" })} disabled={busy}>Edit</button><button className={styles.removeButton} onClick={() => remove(user)} disabled={busy}>Delete</button>
    </article>)}</div>
    {editing && <div className={styles.editorBackdrop} onClick={event => { if (event.target === event.currentTarget) setEditing(null); }}><form className={styles.editorCard} onSubmit={save}>
      <h2>{editing._id ? "Edit portal user" : "Add portal user"}</h2>
      <label><span>Name</span><input required value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })}/></label>
      <label><span>DreamLease email</span><input required type="email" value={editing.email} onChange={event => setEditing({ ...editing, email: event.target.value })}/></label>
      <label><span>{editing._id ? "New password" : "Password"}</span><input required={!editing._id || editing.primaryAdministrator} type="password" minLength={8} value={editing.password || ""} onChange={event => setEditing({ ...editing, password: event.target.value })} autoComplete="new-password"/><small>{editing.primaryAdministrator ? "Set a password of at least 8 characters to manage this account in Portal Users." : editing._id ? "Leave blank to keep the current password." : "Use at least 8 characters."}</small></label>
      <label><span>HubSpot User ID</span><input inputMode="numeric" value={editing.hubspotUserId || ""} onChange={event => setEditing({ ...editing, hubspotUserId: event.target.value })} placeholder="For example, 30999490"/><small>New deals will be assigned to this HubSpot user.</small></label>
      <label><span>Access level</span><select value={editing.role} onChange={event => setEditing({ ...editing, role: event.target.value as PortalUser["role"] })}><option value="sales">Sales: own quotes only</option><option value="management">Management: all records</option></select></label>
      <label className={styles.checkLabel}><input type="checkbox" checked={editing.active} onChange={event => setEditing({ ...editing, active: event.target.checked })}/><span>Account active</span></label>
      <div className={styles.editorActions}><button type="button" onClick={() => setEditing(null)}>Cancel</button><button className={styles.primaryButton} disabled={busy}>{busy ? "Saving..." : "Save user"}</button></div>
    </form></div>}
  </section>;
}

