import { notFound, redirect } from "next/navigation";
import { getStaffSession } from "../../../lib/staffAuth";
import { QuoteForm } from "./QuoteForm";
import { getActiveStaffUsers, staffSanityClient, staffScopeFilter, staffScopeParams } from "../../../lib/staffSanity";
import { uploadedQuoteVehicles } from "../quoteVehicles";
import { QuoteInput, sanitiseQuote } from "../quote";
import styles from "../../staff.module.css";

export const metadata = { title: "New quote | DreamLease" };

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ revise?: string; duplicate?: string }> }) {
  const session = await getStaffSession();
  if (!session) redirect("/staff/login");
  const { revise,duplicate } = await searchParams,sourceId=revise||duplicate;
  const source = sourceId ? await staffSanityClient.fetch<(QuoteInput & { _id:string; quoteNumber:number; quoteReference?:string; createdByEmail:string; calculationVersion?:string }) | null>(`*[_type == "salesQuote" && _id == $id && ${staffScopeFilter}][0]`, { id: sourceId, ...staffScopeParams }) : null;
  if (sourceId && (!source || (session.role !== "management" && source.createdByEmail.toLowerCase() !== session.email.toLowerCase()))) notFound();
  const portalUsers = session.role === "management" ? await getActiveStaffUsers() : [];
  const [managedVehicles,catalogue] = await Promise.all([staffSanityClient.fetch<Array<{ _id:string; sourceId?:string; make:string; model:string; basicListPrice:number; variant?:string; modelYear?:string; transmission?:string; bodyType?:string; co2?:number|null; p11d?:number|null; delivery?:number|null; rfl?:number|null; firstRegistrationFee?:number|null; active?:boolean }>>(`*[_type == "quoteVehicle" && ${staffScopeFilter}] | order(make asc, model asc){_id, sourceId, make, model, basicListPrice, variant, modelYear, transmission, bodyType, co2, p11d, delivery, rfl, firstRegistrationFee, active}`,staffScopeParams),staffSanityClient.fetch<{initialised?:boolean}|null>(`*[_type == "quoteVehicleCatalogue" && ${staffScopeFilter}] | order(_updatedAt desc)[0]{initialised}`,staffScopeParams)]);
  const managedBySource = new Map(managedVehicles.filter(vehicle=>vehicle.sourceId).map(vehicle=>[vehicle.sourceId,vehicle]));
  const managedByName = new Map(managedVehicles.map(vehicle=>[`${vehicle.make}\n${vehicle.model}`,vehicle]));
  const sourceIds = new Set(uploadedQuoteVehicles.map(vehicle=>vehicle.id));
  const vehicles = catalogue?.initialised?managedVehicles.filter(vehicle=>vehicle.active!==false).map(vehicle=>({id:vehicle._id,make:vehicle.make,model:vehicle.model,variant:vehicle.variant,modelYear:vehicle.modelYear,price:vehicle.basicListPrice,transmission:vehicle.transmission,bodyType:vehicle.bodyType,co2:vehicle.co2,p11d:vehicle.p11d,delivery:vehicle.delivery,rfl:vehicle.rfl,firstRegistrationFee:vehicle.firstRegistrationFee})):uploadedQuoteVehicles.flatMap(vehicle=>{const managed=managedBySource.get(vehicle.id)||managedByName.get(`${vehicle.make}\n${vehicle.model}`);if(managed?.active===false)return[];return[managed?{id:managed._id,make:managed.make,model:managed.model,price:managed.basicListPrice,variant:managed.variant,modelYear:managed.modelYear,transmission:managed.transmission,bodyType:managed.bodyType,co2:managed.co2,p11d:managed.p11d,delivery:managed.delivery,rfl:managed.rfl,firstRegistrationFee:managed.firstRegistrationFee}:vehicle];});
  if(!catalogue?.initialised)for(const managed of managedVehicles)if(managed.active!==false&&(!managed.sourceId||!sourceIds.has(managed.sourceId))&&!vehicles.some(vehicle=>vehicle.id===managed._id))vehicles.push({id:managed._id,make:managed.make,model:managed.model,variant:managed.variant,modelYear:managed.modelYear,price:managed.basicListPrice,transmission:managed.transmission,bodyType:managed.bodyType,co2:managed.co2,p11d:managed.p11d,delivery:managed.delivery,rfl:managed.rfl,firstRegistrationFee:managed.firstRegistrationFee});
  return <main className={styles.portal}><header className={styles.portalHeader}><div className={styles.portalBranding}><a className={styles.portalLogo} href="/staff" aria-label="Staff dashboard"><img className={styles.portalLogoImage} src="/dreamlease-logo.png" alt="DreamLease" /></a></div><div><strong>{session.name}</strong><span>{session.role === "management" ? "Management" : "Sales"}</span></div>{session.role==="management"&&<a href="/staff">Dashboard</a>}<a href="/staff/quotes/new">New quote</a>{session.role==="management"&&<a href="/staff/vehicles">Vehicle pricing</a>}<form action="/api/staff-auth/logout" method="post"><button className={styles.textButton}>Sign out</button></form></header>
    <div className={styles.pageHeading}><p className={styles.eyebrow}>Private quote portal</p><h1>{revise&&source?`Revise quote ${source.quoteReference||source.quoteNumber}`:duplicate&&source?`Duplicate quote ${source.quoteReference||source.quoteNumber}`:"New quote"}</h1><p>{revise?"Update the details below. Saving preserves the original and creates a linked revision.":duplicate?"Review and change the copied details. Saving creates a separate quote with a new number.":"Create and check the quote before issuing its consecutive number."}</p><a href="/staff/quotes">{session.role === "management" ? "View all quotes" : "View my quotes"}</a></div>
    <QuoteForm salesperson={session.name} salesEmail={session.email} vehicles={vehicles} management={session.role === "management"} portalUsers={portalUsers} initialSalespersonEmail={source?.createdByEmail} initialQuote={source ? {...sanitiseQuote(source),manufacturerTerms:source.calculationVersion==="automotivate-otr-v1"?Number(source.manufacturerTerms)*100:Number(source.manufacturerTerms)} : undefined} revisionOf={revise?source?._id:undefined} duplicateOf={duplicate?source?._id:undefined} revisionReference={revise&&source?(source.quoteReference||String(source.quoteNumber)):undefined} />
  </main>;
}


