import { redirect } from "next/navigation";
import { getStaffSession } from "../../lib/staffAuth";
import { staffSanityClient, staffScopeFilter, staffScopeParams } from "../../lib/staffSanity";
import styles from "../staff.module.css";

type AuditEvent={_id:string;occurredAt:string;action:string;entityType:string;entityId:string;summary:string;actorName:string;actorEmail:string;before?:string;after?:string};
export const metadata={title:"Audit log | Auto Quote"};

export default async function AuditPage(){
 const session=await getStaffSession();if(!session)redirect("/staff/login");if(session.role!=="management")redirect("/staff/quotes/new");
 const events=await staffSanityClient.fetch<AuditEvent[]>(`*[_type == "staffAuditEvent" && ${staffScopeFilter}] | order(occurredAt desc)[0...500]{_id,occurredAt,action,entityType,entityId,summary,actorName,actorEmail,before,after}`,staffScopeParams);
 return <main className={styles.portal}><header className={styles.portalHeader}><a className={styles.portalLogo} href="/staff" aria-label="Management dashboard"><img src="/automotivate-logo.png" alt="Auto Quote"/></a><div><strong>{session.name}</strong><span>Management</span></div><a href="/staff">Dashboard</a><a href="/staff/quotes/new">New quote</a><a href="/staff/quotes">All quotes</a><form action="/api/staff-auth/logout" method="post"><button className={styles.textButton}>Sign out</button></form></header><div className={styles.pageHeading}><p className={styles.eyebrow}>Management</p><h1>Audit log</h1><p>A permanent record of quote, pricing, catalogue and portal-user changes.</p></div><section className={styles.auditList}>{events.length===0?<p>No tracked changes have been made since the audit log was enabled.</p>:events.map(event=><article key={event._id}><time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString("en-GB")}</time><div><strong>{event.summary}</strong><span>{event.actorName} ({event.actorEmail})</span><small>{event.action} | {event.entityType}</small>{(event.before||event.after)&&<details><summary>View recorded values</summary>{event.before&&<><b>Before</b><pre>{event.before}</pre></>}{event.after&&<><b>After</b><pre>{event.after}</pre></>}</details>}</div></article>)}</section></main>;
}

