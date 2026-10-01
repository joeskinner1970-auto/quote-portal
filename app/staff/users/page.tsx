import { redirect } from "next/navigation";
import { getStaffSession } from "../../lib/staffAuth";
import { staffSanityClient, staffScopeParams } from "../../lib/staffSanity";
import { UserManager, PortalUser } from "./UserManager";
import styles from "../staff.module.css";

export const metadata = { title: "Portal users | DreamLease" };
export default async function UsersPage() {
  const session = await getStaffSession();
  if (!session) redirect("/staff/login");
  if (session.role !== "management") redirect("/staff/quotes/new");
  const users = await staffSanityClient.fetch<PortalUser[]>("*[_type == 'staffUser' && portalEnvironment == $portalEnvironment && !defined(deletedAt)] | order(name asc){_id,name,email,hubspotUserId,role,active}", staffScopeParams);
  if (!users.some(user => user.email.toLowerCase() === session.email.toLowerCase())) users.unshift({ name: session.name, email: session.email, role: "management", active: true, primaryAdministrator: true });
  return <main className={styles.portal}><header className={styles.portalHeader}><a className={styles.portalLogo} href="/staff">DreamLease</a><div><strong>{session.name}</strong><span>Management</span></div><a href="/staff">Dashboard</a><a href="/staff/quotes/new">New quote</a><a href="/staff/quotes">All quotes</a><form action="/api/staff-auth/logout" method="post"><button className={styles.textButton}>Sign out</button></form></header><div className={styles.pageHeading}><p className={styles.eyebrow}>Management</p><h1>Portal users</h1><p>Control who can use the private quote portal.</p></div><UserManager initialUsers={users}/></main>;
}
