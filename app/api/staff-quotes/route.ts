import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getStaffSession } from "../../lib/staffAuth";
import { getActiveStaffUser, staffDataEnvironment, staffSanityClient, staffScopeFilter, staffScopeParams, staffScopedId } from "../../lib/staffSanity";
import { calculateQuote, calculationVersion, nextQuoteNumber, sanitiseQuote, validateQuote } from "../../staff/quotes/quote";
import { rateLimitResponse, takeRateLimit } from "../../lib/formSecurity";
import { staffAuditDocument } from "../../lib/staffAudit";
import { createHubSpotQuoteDeal, deleteHubSpotDealAndTasks } from "../../lib/hubspot";

function hubSpotId(value: unknown) {
  const id = String(value || "").trim();
  return /^\d{1,30}$/.test(id) ? id : "";
}

async function allocateQuoteNumber() {
  const counterId = staffScopedId("salesQuoteCounter");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const [counter,highestNumber] = await Promise.all([
      staffSanityClient.fetch<{ _rev: string; nextNumber: number } | null>(`*[_id == $counterId][0]{_rev, nextNumber}`, { counterId }),
      staffSanityClient.fetch<number | null>(`*[_type == "salesQuote" && portalEnvironment == $portalEnvironment] | order(quoteNumber desc)[0].quoteNumber`, staffScopeParams),
    ]);
    const nextAvailable = nextQuoteNumber(highestNumber, counter?.nextNumber ?? null);
    if (!counter) {
      try {
        await staffSanityClient.create({ _id: counterId, _type: "salesQuoteCounter", portalEnvironment: staffDataEnvironment, nextNumber: nextAvailable + 1 });
        return nextAvailable;
      } catch { continue; }
    }
    const allocated = nextAvailable;
    try {
      await staffSanityClient.patch(counterId).ifRevisionId(counter._rev).set({ nextNumber: allocated + 1 }).commit();
      return allocated;
    } catch { continue; }
  }
  throw new Error("Could not allocate a quote number.");
}

async function repairPrototypeQuoteNumbers() {
  if (staffDataEnvironment !== "prototype") throw new Error("Quote-number repair is only available in the prototype.");
  const quotes = await staffSanityClient.fetch<Array<{_id:string;quoteNumber:number;revisionNumber?:number;createdAt:string}>>(
    `*[_type == "salesQuote" && ${staffScopeFilter} && (!defined(revisionNumber) || revisionNumber == 0)] | order(createdAt asc){_id,quoteNumber,revisionNumber,createdAt}`,
    staffScopeParams,
  );
  const used = new Set<number>(), changes:Array<{id:string;from:number;to:number}>=[];
  let next = Math.max(27999, ...quotes.map(quote=>Number(quote.quoteNumber)||0)) + 1;
  for (const quote of quotes) {
    const number = Number(quote.quoteNumber);
    if (!used.has(number)) { used.add(number); continue; }
    while (used.has(next)) next += 1;
    changes.push({id:quote._id,from:number,to:next});used.add(next);next += 1;
  }
  if (changes.length) {
    let transaction=staffSanityClient.transaction();
    for(const change of changes)transaction=transaction.patch(change.id,patch=>patch.set({quoteNumber:change.to,quoteReference:String(change.to),baseQuoteNumber:change.to}));
    transaction=transaction.patch(staffScopedId("salesQuoteCounter"),patch=>patch.setIfMissing({_type:"salesQuoteCounter",portalEnvironment:staffDataEnvironment}).set({nextNumber:next}));
    await transaction.commit();
  }
  return changes;
}

export async function POST(request: Request) {
  const rateLimit = takeRateLimit(request, "staff-quote-create", 30);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ error: "Sign in again to save this quote." }, { status: 401 });
  try {
    const formRequest=request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
    const body = formRequest ? Object.fromEntries(await request.formData()) : await request.json() as Record<string, unknown>;
    if (body.action === "repair-prototype-numbers") {
      if (session.role !== "management") return NextResponse.json({ error: "Management access is required." }, { status: 403 });
      const changes=await repairPrototypeQuoteNumbers();
      if(formRequest)return NextResponse.redirect(new URL("/staff/quotes",request.url),303);
      return NextResponse.json({ok:true,changes});
    }
    const quote = sanitiseQuote(body);
    const hubspotContactId = hubSpotId(body.hubspotContactId);
    const hubspotCompanyId = hubSpotId(body.hubspotCompanyId);
    const revisionOf = String(body.revisionOf || "");
    const duplicateOf = String(body.duplicateOf || "");
    const sourceId = revisionOf || duplicateOf;
    const isRevision = Boolean(revisionOf);
    const requestedSalespersonEmail = String(body.createdByEmail || "").trim().toLowerCase();
    const quoteCreator = session.role === "management" && requestedSalespersonEmail
      ? await getActiveStaffUser(requestedSalespersonEmail)
      : { name: session.name, email: session.email, hubspotUserId: session.hubspotUserId };
    if (!quoteCreator) return NextResponse.json({ error: "Select an active portal user as the salesperson." }, { status: 400 });
    if (!sourceId && (!hubspotCompanyId || !hubspotContactId)) return NextResponse.json({ error: "Select the customer company and contact from HubSpot." }, { status: 400 });
    const validationError = validateQuote(quote);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    const totals = calculateQuote(quote);
    const source = sourceId ? await staffSanityClient.fetch<{ _id:string; quoteNumber:number; quoteReference?:string; baseQuoteNumber?:number; revisionNumber?:number; createdByEmail:string; hubspotDealId?:string; hubspotOwnerId?:string; hubspotCompanyId?:string; hubspotContactId?:string } | null>(`*[_type == "salesQuote" && _id == $id && ${staffScopeFilter}][0]{_id,quoteNumber,quoteReference,baseQuoteNumber,revisionNumber,createdByEmail,hubspotDealId,hubspotOwnerId,hubspotCompanyId,hubspotContactId}`, { id: sourceId, ...staffScopeParams }) : null;
    if (sourceId && !source) return NextResponse.json({ error: "The original quote could not be found." }, { status: 404 });
    if (source && session.role !== "management" && source.createdByEmail.toLowerCase() !== session.email.toLowerCase()) return NextResponse.json({ error: "You cannot revise this quote." }, { status: 403 });
    const assignedHubspotOwnerId = quoteCreator.hubspotUserId || source?.hubspotOwnerId || "";
    const quoteNumber = isRevision && source ? (source.baseQuoteNumber || source.quoteNumber) : await allocateQuoteNumber();
    const latest = isRevision && source ? await staffSanityClient.fetch<{ _id:string; revisionNumber?:number } | null>(`*[_type == "salesQuote" && (baseQuoteNumber == $number || quoteNumber == $number) && ${staffScopeFilter}] | order(revisionNumber desc)[0]{_id, revisionNumber}`, { number: quoteNumber, ...staffScopeParams }) : null;
    if (isRevision && source && latest && latest._id !== source._id) return NextResponse.json({ error: "This is not the latest version. Open the newest revision before making another amendment." }, { status: 409 });
    const revisionNumber = isRevision && source ? (Number(latest?.revisionNumber) || 0) + 1 : 0;
    const quoteReference = revisionNumber > 0 ? `${quoteNumber}-R${revisionNumber}` : String(quoteNumber);
    const id = `salesQuote-${randomUUID()}`;
    const document = {
      _id: id, _type: "salesQuote", portalEnvironment: staffDataEnvironment, quoteNumber, quoteReference, baseQuoteNumber: quoteNumber, revisionNumber, status: "customer-quoted", createdAt: new Date().toISOString(), createdByName: quoteCreator.name, createdByEmail: quoteCreator.email, hubspotOwnerId: assignedHubspotOwnerId, hubspotCompanyId: hubspotCompanyId || source?.hubspotCompanyId || "", hubspotContactId: hubspotContactId || source?.hubspotContactId || "",
      ...quote,
      factoryOptions: quote.factoryOptions.map((line) => ({ _key: randomUUID(), ...line })),
      dealerOptions: quote.dealerOptions.map((line) => ({ _key: randomUUID(), ...line })),
      totalDiscount: totals.totalDiscount, totalBeforeVat: totals.totalBeforeVat, vat: totals.vat, totalDue: totals.totalDue, orderTotal: totals.orderTotal, calculationVersion, hubspotStatus: "awaiting-update", sharepointStatus: "awaiting-save",
      ...(isRevision && source ? { previousRevision: { _type: "reference", _ref: source._id } } : {}),
    };
    const audit=staffAuditDocument({action:isRevision?"quote.revised":"quote.created",entityType:"quote",entityId:id,summary:`${isRevision?"Created revision":"Created quote"} ${quoteReference} for ${quote.customerCompany}`,actorName:session.name,actorEmail:session.email,after:{quoteReference,customerCompany:quote.customerCompany,totalDue:totals.totalDue}});
    if (isRevision && source) await staffSanityClient.transaction().create(document).patch(source._id, patch => patch.set({ status: "superseded", supersededBy: { _type: "reference", _ref: id } })).create(audit).commit();
    else await staffSanityClient.transaction().create(document).create(audit).commit();

    return NextResponse.json({ ok: true, id, quoteNumber, quoteReference });
  } catch (error) {
    console.error("[staff-quotes:create]", error);
    return NextResponse.json({ error: "The quote could not be saved. No quote number has been issued. Please try again." }, { status: 500 });
  }
}
