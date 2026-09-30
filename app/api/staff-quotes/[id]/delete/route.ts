import { NextResponse } from "next/server";
import { getStaffSession } from "../../../../lib/staffAuth";
import { staffAuditDocument } from "../../../../lib/staffAudit";
import { staffSanityClient, staffScopeFilter, staffScopeParams } from "../../../../lib/staffSanity";
import { deleteHubSpotDealAndTasks } from "../../../../lib/hubspot";

type QuoteFamily = { _id: string; quoteReference?: string; quoteNumber: number; baseQuoteNumber?: number; customerCompany?: string; hubspotDealId?: string };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession();
  if (!session || session.role !== "management") return NextResponse.json({ error: "Management access is required." }, { status: 403 });
  const { id } = await params;
  const quote = await staffSanityClient.fetch<QuoteFamily | null>(`*[_type == "salesQuote" && _id == $id && ${staffScopeFilter}][0]{_id,quoteReference,quoteNumber,baseQuoteNumber,customerCompany,hubspotDealId}`, { id, ...staffScopeParams });
  if (!quote) return NextResponse.redirect(new URL("/staff/quotes", request.url), 303);
  const base = quote.baseQuoteNumber || quote.quoteNumber;
  const family = await staffSanityClient.fetch<QuoteFamily[]>(`*[_type == "salesQuote" && (baseQuoteNumber == $base || quoteNumber == $base) && ${staffScopeFilter}]{_id,quoteReference,quoteNumber,baseQuoteNumber,customerCompany,hubspotDealId}`, { base, ...staffScopeParams });
  const hubspotDealIds = [...new Set(family.map(member => member.hubspotDealId).filter((dealId): dealId is string => Boolean(dealId)))];
  if (hubspotDealIds.length) await Promise.all(hubspotDealIds.map(dealId => deleteHubSpotDealAndTasks(dealId)));
  let transaction = staffSanityClient.transaction();
  for (const member of family) transaction = transaction.delete(member._id);
  await transaction.create(staffAuditDocument({
    action: "quote.deleted",
    entityType: "quote",
    entityId: String(base),
    summary: `Deleted quote ${quote.quoteReference || quote.quoteNumber} and ${Math.max(0, family.length - 1)} revision(s)`,
    actorName: session.name,
    actorEmail: session.email,
    before: { quoteReferences: family.map(member => member.quoteReference || String(member.quoteNumber)), customerCompany: quote.customerCompany, hubspotDealIds },
  })).commit();
  return NextResponse.redirect(new URL("/staff/quotes", request.url), 303);
}
