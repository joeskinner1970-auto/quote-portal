import { redirect } from "next/navigation";
import { getStaffSession } from "../../lib/staffAuth";
import { LoginForm } from "./LoginForm";
import styles from "../staff.module.css";

export const metadata = { title: "Staff sign in | Auto Quote" };

export default async function StaffLoginPage() {
  if (await getStaffSession()) redirect("/staff/quotes/new");
  return <main className={styles.portal}><section className={styles.loginCard}>
    <div className={styles.loginBranding}><strong>Auto Quote</strong></div>
    <p className={styles.eyebrow}>Private staff area</p>
    <h1>Quote portal</h1>
    <p>Sign in using the administrator password.</p>
    <LoginForm />
  </section></main>;
}

