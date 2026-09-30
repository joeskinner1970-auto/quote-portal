import { NextResponse } from "next/server";
import { getStaffSession } from "../../../../lib/staffAuth";
import { staffAuditDocument } from "../../../../lib/staffAudit";
import { getActiveStaffUsers, staffSanityClient, staffScopeFilter, staffScopeParams } from "../../../../lib/staffSanity";
import { updateHubSpotDealOwner } from "../../../../lib/hubspot";

type QuoteOwnerRecord = { _id: string; quoteReference?: string; quoteNumber?: number; baseQuoteNumber?: number; createdByName?: string; createdByEmail?: string; hubspotDealId?: string; hubspotOwnerId?: string };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession();
  if (!session || session.role !== "management") return NextResponse.json({ error: "Management access is required." }, { status: 403 });
  const { id } = await params, form = await request.formData(), ownerId = String(form.get("ownerId") || "").trim();
  const quote = await staffSanityClient.fetch<QuoteOwnerRecord | null>(`*[_type == "salesQuote" && _id == $id && ${staffScopeFilter}][0]{_id,quoteReference,quoteNumber,baseQuoteNumber,createdByName,createdByEmail,hubspotDealId,hubspotOwnerId}`, { id, ...staffScopeParams });
  if (!quote) return NextResponse.redirect(new URL("/staff/quotes", request.url), 303);
  const owner = (await getActiveStaffUsers()).find(user => user.hubspotUserId === ownerId);
  if (!owner) return NextResponse.json({ error: "Select an active portal user with a HubSpot User ID." }, { status: 400 });

  const base = quote.baseQuoteNumber || quote.quoteNumber || 0;
  const related = base ? await staffSanityClient.fetch<Array<{ _id: string }>>(`*[_type == "salesQuote" && (baseQuoteNumber == $base || quoteNumber == $base) && ${staffScopeFilter}]{_id}`, { base, ...staffScopeParams }) : [];
  const quoteIds = [...new Set([id, ...related.map(item => item._id)])];
  const now = new Date().toISOString();
  const update = { createdByName: owner.name, createdByEmail: owner.email, hubspotOwnerId: ownerId, hubspotOwnerName: owner.name, hubspotStatus: quote.hubspotDealId ? "awaiting-update" : "updated", hubspotError: "" };
  let transaction = staffSanityClient.transaction();
  quoteIds.forEach(quoteId => { transaction = transaction.patch(quoteId, patch => patch.set(update)); });
  await transaction.create(staffAuditDocument({ action: "quote.owner_changed", entityType: "quote", entityId: id, summary: `Quote ${quote.quoteReference || quote.quoteNumber} and ${Math.max(0, quoteIds.length - 1)} related version${quoteIds.length === 2 ? "" : "s"} reassigned to ${owner.name}`, actorName: session.name, actorEmail: session.email, before: { createdByName: quote.createdByName, createdByEmail: quote.createdByEmail, hubspotOwnerId: quote.hubspotOwnerId }, after: { createdByName: owner.name, createdByEmail: owner.email, hubspotOwnerId: ownerId, hubspotOwnerName: owner.name } })).commit();

  if (quote.hubspotDealId) {
    try {
      await updateHubSpotDealOwner(quote.hubspotDealId, ownerId);
      await staffSanityClient.patch(id).set({ hubspotStatus: "updated", hubspotUpdatedAt: now, hubspotUpdatedBy: session.name }).commit();
    } catch (error) {
      const hubspotError = error instanceof Error ? error.message : "HubSpot could not be updated.";
      await staffSanityClient.patch(id).set({ hubspotStatus: "failed", hubspotError }).commit();
    }
  }
  return NextResponse.redirect(new URL(`/staff/quotes/${id}`, request.url), 303);
}