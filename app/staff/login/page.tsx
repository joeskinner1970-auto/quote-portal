import { redirect } from "next/navigation";
import { getStaffSession } from "../../lib/staffAuth";
import { LoginForm } from "./LoginForm";
import styles from "../staff.module.css";

export const metadata = { title: "Staff sign in | DreamLease" };

export default async function StaffLoginPage() {
  if (await getStaffSession()) redirect("/staff/quotes/new");
  return <main className={styles.portal}><section className={styles.loginCard}>
    <div className={styles.loginBranding}><img className={styles.loginLogoImage} src="/dreamlease-logo.png" alt="DreamLease" /></div>
    <p className={styles.eyebrow}>Private staff area</p>
    <h1>Quote portal</h1>
    <p>Sign in using your portal email address and password.</p>
    <LoginForm />
  </section></main>;
}


