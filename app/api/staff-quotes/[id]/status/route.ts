import { NextResponse } from "next/server";
import { getStaffSession } from "../../../../lib/staffAuth";
import { staffSanityClient, staffScopeFilter, staffScopeParams } from "../../../../lib/staffSanity";
import { rateLimitResponse, takeRateLimit } from "../../../../lib/formSecurity";
import { staffAuditDocument } from "../../../../lib/staffAudit";
import { updateHubSpotDealStage } from "../../../../lib/hubspot";

const statusLabels:Record<string,string>={"customer-quoted":"Customer Quoted",negotiating:"Negotiating","awaiting-order":"Awaiting Order","closed-won":"Closed Won","closed-lost":"Closed Lost"};
const statuses = new Set(Object.keys(statusLabels));

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const rateLimit=takeRateLimit(request,"staff-quote-status",40);if(!rateLimit.allowed)return rateLimitResponse(rateLimit.retryAfterSeconds);
 const session=await getStaffSession();if(!session)return NextResponse.json({error:"Sign in is required."},{status:401});
 const {id}=await params,form=await request.formData(),status=String(form.get("status")||"");if(!statuses.has(status))return NextResponse.json({error:"Select a valid status."},{status:400});
 const quote=await staffSanityClient.fetch<Record<string,unknown>|null>(`*[_type == "salesQuote" && _id == $id && ${staffScopeFilter}][0]`,{id,...staffScopeParams});if(!quote)return NextResponse.json({error:"Quote not found."},{status:404});
 const createdByEmail=String(quote.createdByEmail||"").toLowerCase();if(session.role!=="management"&&createdByEmail!==session.email.toLowerCase())return NextResponse.json({error:"You can only update quotes created using your account."},{status:403});
 const now=new Date().toISOString(),quoteReference=String(quote.quoteReference||quote.quoteNumber||"");let orderId="";
 let transaction=staffSanityClient.transaction().patch(id,patch=>patch.set({status,statusUpdatedAt:now,statusUpdatedBy:session.email})).create(staffAuditDocument({action:"quote.status_changed",entityType:"quote",entityId:id,summary:`Quote ${quoteReference} status changed from ${String(quote.status||"customer-quoted")} to ${status}`,actorName:session.name,actorEmail:session.email,before:{status:quote.status||"customer-quoted"},after:{status}}));
 if(status==="closed-won"&&quote.quoteType==="sales"&&quote.documentType!=="sales-order"){
   const existingOrderId=await staffSanityClient.fetch<string|null>(`*[_type == "salesQuote" && orderOf._ref == $id && ${staffScopeFilter}][0]._id`,{id,...staffScopeParams});
   orderId=existingOrderId||`salesOrder-${id}`;
   if(!existingOrderId){
     const {_id,_rev,_createdAt,_updatedAt,previousRevision,supersededBy,hubspotDealId,hubspotError,hubspotUpdatedAt,hubspotUpdatedBy,hubspotStatus,...orderFields}=quote;
     transaction=transaction.create({_id:orderId,_type:"salesQuote",...orderFields,quoteReference:`${quoteReference}/Order`,documentType:"sales-order",orderOf:{_type:"reference",_ref:id},status:"closed-won",createdAt:now,statusUpdatedAt:now,statusUpdatedBy:session.email,hubspotStatus:"updated",hubspotUpdatedAt:now,hubspotUpdatedBy:session.name,hubspotError:"",sharepointStatus:"awaiting-save"}).create(staffAuditDocument({action:"quote.order_created",entityType:"quote",entityId:orderId,summary:`Created sales order ${quoteReference}/Order from quote ${quoteReference}`,actorName:session.name,actorEmail:session.email,after:{quoteReference:`${quoteReference}/Order`,sourceQuote:quoteReference}}));
   }
 }
 await transaction.commit();
 const hubspotDealId=String(quote.hubspotDealId||"");if(hubspotDealId)try{await updateHubSpotDealStage(hubspotDealId,statusLabels[status]);await staffSanityClient.patch(id).set({hubspotStatus:"updated",hubspotUpdatedAt:now,hubspotUpdatedBy:session.name,hubspotError:""}).commit()}catch(error){const hubspotError=error instanceof Error?error.message:"HubSpot could not be updated.";console.error("[staff-quotes:status-hubspot]",error);await staffSanityClient.patch(id).set({hubspotStatus:"failed",hubspotError}).commit()}
 return NextResponse.redirect(new URL(`/staff/quotes/${orderId||id}`,request.url),303);
}
