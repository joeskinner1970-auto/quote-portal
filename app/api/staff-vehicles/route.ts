import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getStaffSession } from "../../lib/staffAuth";
import { staffDataEnvironment, staffSanityClient, staffScopeFilter, staffScopeParams, staffScopedId } from "../../lib/staffSanity";
import { uploadedQuoteVehicles } from "../../staff/quotes/quoteVehicles";
import { takeRateLimit, rateLimitResponse } from "../../lib/formSecurity";
import { staffAuditDocument } from "../../lib/staffAudit";

type VehicleInput={_id?:unknown;sourceId?:unknown;make?:unknown;model?:unknown;variant?:unknown;modelYear?:unknown;price?:unknown;basicListPrice?:unknown;transmission?:unknown;bodyType?:unknown;co2?:unknown;p11d?:unknown;delivery?:unknown;rfl?:unknown;firstRegistrationFee?:unknown;active?:unknown;priceCheckedAt?:unknown;managementNotes?:unknown};
type Vehicle=ReturnType<typeof normalise>&{_id?:string};
const clean=(value:unknown,max=500)=>String(value??"").trim().slice(0,max);
const key=(vehicle:Pick<Vehicle,"sourceId"|"make"|"model"|"variant"|"modelYear">)=>vehicle.sourceId||`${vehicle.make}\n${vehicle.model}\n${vehicle.variant}\n${vehicle.modelYear}`;
const documentId=(sourceId:string,make:string,model:string,variant:string,modelYear:string)=>`quoteVehicle-${staffDataEnvironment}-${clean(sourceId,80).replace(/[^a-z0-9_-]/gi,"-")||createHash("sha256").update(`${make}\n${model}\n${variant}\n${modelYear}`).digest("hex").slice(0,24)}`;
function optionalNumber(value:unknown){if(value===""||value===null||value===undefined)return null;const number=Number(value);return Number.isFinite(number)&&number>=0?Math.round(number*100)/100:null;}
function normalise(input:VehicleInput){const make=clean(input.make,100),model=clean(input.model,500),price=Number(input.basicListPrice??input.price);if(!make||!model||!Number.isFinite(price)||price<0)throw new Error("Every vehicle needs a make, model and a valid price of zero or more.");return{sourceId:clean(input.sourceId,80),make,model,variant:clean(input.variant,500),modelYear:clean(input.modelYear,40),basicListPrice:Math.round(price*100)/100,transmission:clean(input.transmission,120),bodyType:clean(input.bodyType,120),co2:optionalNumber(input.co2),p11d:optionalNumber(input.p11d),delivery:optionalNumber(input.delivery),rfl:optionalNumber(input.rfl),firstRegistrationFee:optionalNumber(input.firstRegistrationFee),active:input.active!==false,priceCheckedAt:clean(input.priceCheckedAt,10),managementNotes:clean(input.managementNotes,2000)};}
const same=(a:Vehicle,b:Vehicle)=>a.make===b.make&&a.model===b.model&&(a.variant||"")===(b.variant||"")&&(a.modelYear||"")===(b.modelYear||"")&&a.basicListPrice===b.basicListPrice&&a.transmission===b.transmission&&a.bodyType===b.bodyType&&(a.co2??null)===(b.co2??null)&&(a.p11d??null)===(b.p11d??null)&&(a.delivery??null)===(b.delivery??null)&&(a.rfl??null)===(b.rfl??null)&&(a.firstRegistrationFee??null)===(b.firstRegistrationFee??null)&&a.active===b.active;

async function currentCatalogue():Promise<Vehicle[]>{
 const [saved,catalogue]=await Promise.all([
  staffSanityClient.fetch<Vehicle[]>(`*[_type == "quoteVehicle" && ${staffScopeFilter}]{_id,sourceId,make,model,variant,modelYear,basicListPrice,transmission,bodyType,co2,p11d,delivery,rfl,firstRegistrationFee,active,priceCheckedAt,managementNotes}`,staffScopeParams),
  staffSanityClient.fetch<{initialised?:boolean}|null>(`*[_type == "quoteVehicleCatalogue" && ${staffScopeFilter}] | order(_updatedAt desc)[0]{initialised}`,staffScopeParams),
 ]);
 if(catalogue?.initialised)return saved;
 const bySource=new Map(saved.filter(x=>x.sourceId).map(x=>[x.sourceId,x])),byName=new Map(saved.map(x=>[`${x.make}\n${x.model}`,x]));
 return uploadedQuoteVehicles.map(item=>bySource.get(item.id)||byName.get(`${item.make}\n${item.model}`)||normalise({sourceId:item.id,make:item.make,model:item.model,price:item.price,active:true}));
}

async function publishCatalogue(incoming:Vehicle[],fileName:string,userEmail:string,userName:string,rolledBackFrom?:string){
 const previous=await currentCatalogue(),now=new Date().toISOString(),existingByKey=new Map(previous.filter(x=>x._id).map(x=>[key(x),x._id!]));
 const incomingKeys=new Set(incoming.map(key));let added=0,changed=0,unchanged=0;
 for(const item of incoming){const old=previous.find(x=>key(x)===key(item));if(!old)added++;else if(same(old,item))unchanged++;else changed++;}
 const disabled=previous.filter(x=>x.sourceId&&x.active!==false&&!incomingKeys.has(key(x))).length;
 const commitBatches=async<T>(items:T[],add:(transaction:ReturnType<typeof staffSanityClient.transaction>,item:T)=>ReturnType<typeof staffSanityClient.transaction>)=>{for(let offset=0;offset<items.length;offset+=500){let transaction=staffSanityClient.transaction();for(const item of items.slice(offset,offset+500))transaction=add(transaction,item);await transaction.commit();}};
 await commitBatches(previous.filter(old=>old._id&&old.sourceId&&!incomingKeys.has(key(old))), (transaction,old)=>transaction.patch(old._id!,patch=>patch.set({active:false,portalEnvironment:staffDataEnvironment,updatedAt:now,updatedBy:userEmail})));
 await commitBatches(incoming, (transaction,vehicle)=>{const id=existingByKey.get(key(vehicle))||documentId(vehicle.sourceId,vehicle.make,vehicle.model,vehicle.variant,vehicle.modelYear);return transaction.createOrReplace({_id:id,_type:"quoteVehicle",portalEnvironment:staffDataEnvironment,...vehicle,updatedAt:now,updatedBy:userEmail});});
 const importId=`quoteVehicleImport-${staffDataEnvironment}-${randomUUID()}`;
 let finalTransaction=staffSanityClient.transaction().create({_id:importId,_type:"quoteVehicleImport",portalEnvironment:staffDataEnvironment,fileName,importedAt:now,importedBy:userEmail,recordCount:incoming.length,added,changed,disabled,...(rolledBackFrom?{rolledBackFrom}:{}),...(previous.length<=1000?{previousCatalogue:previous.map((vehicle,index)=>({_key:`vehicle-${index}`,...normalise(vehicle)}))}:{})});
 finalTransaction=finalTransaction.create(staffAuditDocument({action:rolledBackFrom?"catalogue.rolled_back":"catalogue.published",entityType:"catalogue",entityId:importId,summary:`${rolledBackFrom?"Restored":"Published"} vehicle catalogue ${fileName}`,actorName:userName,actorEmail:userEmail,before:{recordCount:previous.length},after:{recordCount:incoming.length,added,changed,disabled}}));
 finalTransaction=finalTransaction.createOrReplace({_id:staffScopedId("quoteVehicleCatalogue"),_type:"quoteVehicleCatalogue",portalEnvironment:staffDataEnvironment,initialised:true,recordCount:incoming.length,updatedAt:now,updatedBy:userEmail});
 await finalTransaction.commit();return{count:incoming.length,added,changed,unchanged,disabled,importId};
}

export async function POST(request:Request){
 const limit=takeRateLimit(request,"staff-vehicle-write",60);if(!limit.allowed)return rateLimitResponse(limit.retryAfterSeconds);
 const session=await getStaffSession();if(!session||session.role!=="management")return NextResponse.json({error:"Management access is required."},{status:403});
 const origin=request.headers.get("origin");if(origin&&new URL(origin).host!==new URL(request.url).host)return NextResponse.json({error:"Invalid request origin."},{status:403});
 try{
  const body=await request.json() as {action?:string;vehicle?:VehicleInput;vehicles?:VehicleInput[];fileName?:string;importId?:string};
  if(body.action==="save"&&body.vehicle){const vehicle=normalise(body.vehicle),requestedId=clean(body.vehicle._id,200),id=requestedId.startsWith("quoteVehicle-")?requestedId:documentId(vehicle.sourceId,vehicle.make,vehicle.model,vehicle.variant,vehicle.modelYear),before=await staffSanityClient.fetch<Vehicle|null>(`*[_id == $id && ${staffScopeFilter}][0]{sourceId,make,model,variant,modelYear,basicListPrice,transmission,bodyType,co2,p11d,delivery,rfl,firstRegistrationFee,active,priceCheckedAt,managementNotes}`,{id,...staffScopeParams}),after={_id:id,_type:"quoteVehicle",portalEnvironment:staffDataEnvironment,...vehicle,updatedAt:new Date().toISOString(),updatedBy:session.email};await staffSanityClient.transaction().createOrReplace(after).create(staffAuditDocument({action:before?"vehicle.updated":"vehicle.created",entityType:"vehicle",entityId:id,summary:`${before?"Updated":"Added"} ${vehicle.make} ${vehicle.model}`,actorName:session.name,actorEmail:session.email,before:before||undefined,after:vehicle})).commit();return NextResponse.json({ok:true,id});}
  if(body.action==="import"&&Array.isArray(body.vehicles)){if(!body.vehicles.length||body.vehicles.length>10000)return NextResponse.json({error:"Import between 1 and 10,000 vehicles."},{status:400});const vehicles=body.vehicles.map(normalise),duplicateKeys=vehicles.map(key).filter((item,index,all)=>all.indexOf(item)!==index);if(duplicateKeys.length)return NextResponse.json({error:"The import contains duplicate vehicle records. Remove duplicates before publishing."},{status:400});return NextResponse.json({ok:true,...await publishCatalogue(vehicles,clean(body.fileName,240)||"Vehicle catalogue upload",session.email,session.name)});}
  if(body.action==="rollback"&&body.importId){const source=await staffSanityClient.fetch<{_id:string;fileName?:string;previousCatalogue?:Vehicle[]}|null>(`*[_type == "quoteVehicleImport" && _id == $id && ${staffScopeFilter}][0]{_id,fileName,previousCatalogue}`,{id:clean(body.importId,200),...staffScopeParams});if(!source?.previousCatalogue?.length)return NextResponse.json({error:"That catalogue version cannot be restored."},{status:400});return NextResponse.json({ok:true,...await publishCatalogue(source.previousCatalogue.map(normalise),`Rollback of ${source.fileName||"catalogue update"}`,session.email,session.name,source._id)});}
  return NextResponse.json({error:"Choose a valid catalogue action."},{status:400});
 }catch(error){console.error("[staff-vehicles]",error);return NextResponse.json({error:error instanceof Error?error.message:"The catalogue could not be updated."},{status:500});}
}

