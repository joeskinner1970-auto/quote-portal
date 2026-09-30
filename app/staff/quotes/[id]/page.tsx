import { notFound, redirect } from "next/navigation";
import { getStaffSession } from "../../../lib/staffAuth";
import { getActiveStaffUsers, staffSanityClient, staffScopeFilter, staffScopeParams } from "../../../lib/staffSanity";
import styles from "../../staff.module.css";
import { PrintButton } from "./PrintButton";
import { QuoteDocument } from "../QuoteDocument";
import { QuoteInput } from "../quote";
import { DeleteQuoteButton } from "./DeleteQuoteButton";

type SavedQuote = QuoteInput & { _id:string; quoteNumber:number; quoteReference?:string; baseQuoteNumber?:number; status?:string; documentType?:"quote"|"sales-order"; createdAt:string; createdByName:string; createdByEmail:string; hubspotStatus?:string; hubspotError?:string; hubspotUpdatedAt?:string; hubspotUpdatedBy?:string; sharepointStatus?:string; sharepointSavedAt?:string; sharepointSavedBy?:string; hubspotDealId?:string; hubspotOwnerId?:string; hubspotOwnerName?:string };
type Revision = { _id:string; quoteReference?:string; quoteNumber:number; status?:string; createdAt:string };
const labels:Record<string,string>={created:"Customer Quoted",issued:"Customer Quoted",accepted:"Closed Won",declined:"Closed Lost",expired:"Closed Lost",superseded:"Superseded","customer-quoted":"Customer Quoted",negotiating:"Negotiating","awaiting-order":"Awaiting Order","closed-won":"Closed Won","closed-lost":"Closed Lost"};

export default async function QuotePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession(); if (!session) redirect("/staff/login");
  const { id } = await params;
  const quote = await staffSanityClient.fetch<SavedQuote | null>(`*[_type == "salesQuote" && _id == $id && ${staffScopeFilter}][0]`, { id, ...staffScopeParams });
  if (!quote || (session.role !== "management" && quote.createdByEmail.toLowerCase() !== session.email.toLowerCase())) notFound();
  const base=quote.baseQuoteNumber||quote.quoteNumber;
  const history=await staffSanityClient.fetch<Revision[]>(`*[_type == "salesQuote" && documentType != "sales-order" && (baseQuoteNumber == $base || quoteNumber == $base) && ${staffScopeFilter}] | order(revisionNumber asc){_id,quoteReference,quoteNumber,status,createdAt}`,{base,...staffScopeParams});
  const owners=session.role==="management"?await getActiveStaffUsers():[],selectedOwnerId=quote.hubspotOwnerId||owners.find(owner=>owner.email.toLowerCase()===quote.createdByEmail.toLowerCase())?.hubspotUserId||"";
  const latest=history.at(-1),status=quote.status==="created"?"customer-quoted":quote.status||"customer-quoted";
  const hubspotComplete=quote.hubspotStatus==="updated",isOrder=quote.documentType==="sales-order";
  return <main className={styles.previewPage}>
    <header className={styles.portalHeader}><div className={styles.portalBranding}><a className={styles.portalLogo} href="/staff" aria-label="Management dashboard"><span className={styles.portalWordmark}><span>Dream</span><b>Lease</b></span></a></div><div><strong>{session.name}</strong><span>{session.role === "management" ? "Management" : "Sales"}</span></div>{session.role==="management"&&<a href="/staff">Dashboard</a>}<a href="/staff/quotes/new">New quote</a><a href="/staff/quotes">{session.role === "management" ? "All quotes" : "My quotes"}</a><form action="/api/staff-auth/logout" method="post"><button className={styles.textButton}>Sign out</button></form></header>
    <nav className={styles.previewActions}><strong className={styles.quoteOptionsHeading}>Quote Options</strong><div className={styles.previewActionButtons}><a className={styles.emailQuoteButton} href={`mailto:${encodeURIComponent(quote.customerEmail)}?subject=${encodeURIComponent("DreamLease Vehicle Quotation")}`}>Send</a><a className={styles.pdfButton} href={`/api/staff-quotes/${id}/pdf`}>Download</a><PrintButton href={`/api/staff-quotes/${id}/pdf?print=1`} /><a className={styles.optionButton} href={`/staff/quotes/new?duplicate=${quote._id}`}>Duplicate</a>{latest?._id===quote._id&&<a className={styles.optionButton} href={`/staff/quotes/new?revise=${quote._id}`}>Revise</a>}{session.role==="management"&&<DeleteQuoteButton action={`/api/staff-quotes/${id}/delete`} quoteReference={quote.quoteReference||String(quote.quoteNumber)}/>}</div></nav>
    <section className={styles.quoteManagement}><div><span>Status</span><strong className={`${styles.statusBadge} ${styles[`status_${status}`]||""}`}>{labels[status]||status}</strong></div>{!isOrder&&<form action={`/api/staff-quotes/${id}/status`} method="post"><label><span>Update status</span><select name="status" defaultValue={status}><option value="customer-quoted">Customer Quoted</option><option value="negotiating">Negotiating</option><option value="awaiting-order">Awaiting Order</option><option value="closed-won">Closed Won</option><option value="closed-lost">Closed Lost</option></select></label><button type="submit">Save status</button></form>}{session.role==="management"&&<form action={`/api/staff-quotes/${id}/owner`} method="post"><label><span>Deal owner</span><select name="ownerId" defaultValue={selectedOwnerId} required><option value="">Select owner...</option>{owners.map(owner=><option key={owner.email} value={owner.hubspotUserId||""} disabled={!owner.hubspotUserId}>{owner.name}{owner.hubspotUserId?"":" (HubSpot User ID needed)"}</option>)}</select></label><button type="submit">Save owner</button></form>}{history.length>1&&<div className={styles.revisionHistory}><span>Version history</span>{history.map(item=><a key={item._id} href={`/staff/quotes/${item._id}`} aria-current={item._id===quote._id?"page":undefined}>{item.quoteReference||item.quoteNumber} ({labels[item.status||"customer-quoted"]||item.status})</a>)}</div>}</section>
    {!isOrder&&<section className={styles.workflowCards}>
      <article className={hubspotComplete?styles.workflowComplete:""}><div><strong>{hubspotComplete?"HubSpot updated":quote.hubspotStatus==="failed"?"HubSpot needs attention":"Updating HubSpot"}</strong><span>{hubspotComplete?`Confirmed by ${quote.hubspotUpdatedBy} on ${new Date(quote.hubspotUpdatedAt!).toLocaleString("en-GB")}.`:quote.hubspotError||"This quote has not yet been sent to HubSpot."}</span></div><a href="https://app.hubspot.com/" target="_blank" rel="noopener noreferrer">Open HubSpot</a>{!hubspotComplete&&<form action={`/api/staff-quotes/${id}/hubspot`} method="post"><button type="submit">Send to HubSpot</button></form>}</article>
    </section>}
    <QuoteDocument quote={quote} quoteNumber={quote.quoteNumber} quoteReference={quote.quoteReference} salesperson={quote.createdByName} salesEmail={quote.createdByEmail} isOrder={isOrder}/>
  </main>;
}

