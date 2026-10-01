import { redirect } from "next/navigation";
import { getStaffSession } from "../../lib/staffAuth";
import { staffDataEnvironment, staffSanityClient, staffScopeFilter, staffScopeParams } from "../../lib/staffSanity";
import { uploadedQuoteVehicles } from "../quotes/quoteVehicles";
import { VehicleManager, ManagedVehicle } from "./VehicleManager";
import styles from "../staff.module.css";

export const metadata={title:"Vehicle pricing | DreamLease"};
export default async function VehiclePricingPage(){
 const session=await getStaffSession();if(!session)redirect("/staff/login");if(session.role!=="management")redirect("/staff/quotes/new");
 const [saved,catalogue,history]=await Promise.all([staffSanityClient.fetch<ManagedVehicle[]>(`*[_type == "quoteVehicle" && ${staffScopeFilter}] | order(make asc,model asc){_id,sourceId,make,model,"price":basicListPrice,variant,modelYear,transmission,bodyType,co2,p11d,delivery,rfl,firstRegistrationFee,active,updatedAt,updatedBy}`,staffScopeParams),staffSanityClient.fetch<{initialised?:boolean}|null>(`*[_type == "quoteVehicleCatalogue" && ${staffScopeFilter}] | order(_updatedAt desc)[0]{initialised}`,staffScopeParams),staffSanityClient.fetch<Array<{_id:string;fileName:string;importedAt:string;importedBy:string;recordCount:number;added:number;changed:number;disabled:number;rolledBackFrom?:string}>>(`*[_type == "quoteVehicleImport" && portalEnvironment == $portalEnvironment] | order(importedAt desc)[0...10]{_id,fileName,importedAt,importedBy,recordCount,added,changed,disabled,rolledBackFrom}`,staffScopeParams)]);
 const bySource=new Map(saved.filter(x=>x.sourceId).map(x=>[x.sourceId,x])),byName=new Map(saved.map(x=>[`${x.make}\n${x.model}`,x]));
 const sourceIds=new Set(uploadedQuoteVehicles.map(x=>x.id));
 const vehicles:ManagedVehicle[]=catalogue?.initialised?saved:uploadedQuoteVehicles.map(source=>{const managed=bySource.get(source.id)||byName.get(`${source.make}\n${source.model}`);return managed?{...managed,sourceId:source.id}:{sourceId:source.id,make:source.make,model:source.model,price:source.price,active:true};});
 if(!catalogue?.initialised)for(const item of saved)if(!item.sourceId||!sourceIds.has(item.sourceId))if(!vehicles.some(x=>x._id===item._id))vehicles.push(item);
 return <main className={styles.portal}><header className={styles.portalHeader}><a className={styles.portalLogo} href="/staff" aria-label="Management dashboard"><img className={styles.portalLogoImage} src="/dreamlease-logo.png" alt="DreamLease" /></a><div><strong>{session.name}</strong><span>Management</span></div><a href="/staff">Dashboard</a><a href="/staff/quotes/new">New quote</a><a href="/staff/quotes">All quotes</a><form action="/api/staff-auth/logout" method="post"><button className={styles.textButton}>Sign out</button></form></header><div className={styles.pageHeading}><p className={styles.eyebrow}>Management</p><h1>Vehicle pricing</h1><p>The approved catalogue used by every new quote. Changes take effect immediately after saving.</p><span className={styles.environmentBadge}>{staffDataEnvironment === "prototype" ? "Prototype catalogue" : "Live catalogue"}</span></div><VehicleManager initialVehicles={vehicles} sourceVehicles={uploadedQuoteVehicles} importHistory={history}/></main>;
}


