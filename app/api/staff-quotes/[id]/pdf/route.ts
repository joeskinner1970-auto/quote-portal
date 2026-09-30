import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getStaffSession } from "../../../../lib/staffAuth";
import { staffSanityClient, staffScopeFilter, staffScopeParams } from "../../../../lib/staffSanity";
import { createFallbackQuotePdf, createQuotePdf } from "../../../../staff/quotes/quotePdf";
import { sanitiseQuote } from "../../../../staff/quotes/quote";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const session=await getStaffSession(); if(!session)return NextResponse.json({error:"Sign in again to download this PDF."},{status:401});
  const disposition=new URL(request.url).searchParams.get("print")==="1"?"inline":"attachment";
  const {id}=await params; const saved=await staffSanityClient.fetch<Record<string,unknown>|null>(`*[_type == "salesQuote" && _id == $id && ${staffScopeFilter}][0]`,{id,...staffScopeParams});
  if(!saved)return NextResponse.json({error:"Quote not found."},{status:404}); const owner=String(saved.createdByEmail||"").toLowerCase(); if(session.role!=="management"&&owner!==session.email.toLowerCase())return NextResponse.json({error:"Quote not found."},{status:404});
  try{const quote=sanitiseQuote(saved);const number=Number(saved.quoteNumber),reference=String(saved.quoteReference||number),isOrder=saved.documentType==="sales-order";const pdf=await createQuotePdf(quote,{quoteNumber:number,quoteReference:reference,salesperson:String(saved.createdByName||session.name),salesEmail:String(saved.createdByEmail||session.email),isOrder});const company=quote.customerCompany.replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"")||"customer";return new NextResponse(Buffer.from(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`${disposition}; filename="${isOrder?"Sales-Order":"Quote"}-${reference}-${company}.pdf"`,"Cache-Control":"private, no-store"}});}catch(error){console.error("[staff-quotes:saved-pdf]",error);try{const quote=sanitiseQuote(saved);const number=Number(saved.quoteNumber),reference=String(saved.quoteReference||number),isOrder=saved.documentType==="sales-order";const pdf=await createFallbackQuotePdf(quote,{quoteNumber:number,quoteReference:reference,salesperson:String(saved.createdByName||session.name),salesEmail:String(saved.createdByEmail||session.email),isOrder});return new NextResponse(Buffer.from(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`${disposition}; filename="Quote-${reference}.pdf"`,"Cache-Control":"private, no-store"}})}catch(fallbackError){console.error("[staff-quotes:saved-pdf-fallback]",fallbackError);return NextResponse.json({error:"The PDF could not be created. Please try again."},{status:500});}}
}
