import { NextResponse } from "next/server";
import { getStaffSession } from "../../../../lib/staffAuth";
import { getActiveStaffUser, staffSanityClient, staffScopeFilter, staffScopeParams } from "../../../../lib/staffSanity";
import { createHubSpotQuoteDeal } from "../../../../lib/hubspot";
import { calculateQuote, type QuoteInput } from "../../../../staff/quotes/quote";

type StoredQuote = QuoteInput & {
  _id: string;
  quoteReference?: string;
  quoteNumber: number;
  status?: string;
  createdByName: string;
  createdByEmail: string;
  hubspotOwnerId?: string;
};
const stageLabels:Record<string,string>={"customer-quoted":"Customer Quoted",negotiating:"Negotiating","awaiting-order":"Awaiting Order","closed-won":"Closed Won","closed-lost":"Closed Lost"};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession();
  if (!session) return NextResponse.redirect(new URL("/staff/login", request.url), 303);
  const { id } = await params;
  const quote = await staffSanityClient.fetch<StoredQuote | null>(
    `*[_type == "salesQuote" && _id == $id && ${staffScopeFilter}][0]`,
    { id, ...staffScopeParams },
  );
  if (!quote || (session.role !== "management" && quote.createdByEmail.toLowerCase() !== session.email.toLowerCase())) {
    return NextResponse.redirect(new URL("/staff/quotes", request.url), 303);
  }
  try {
    const [totals, owner] = [calculateQuote(quote), await getActiveStaffUser(quote.createdByEmail)];
    const profitInMetal = (totals.subtotal * quote.dealerMarginPct / 100 + quote.dealerDiscountRetained + totals.commission) * quote.quantity;
    const profitInDealerOptions = quote.dealerOptions.reduce((sum, option) => sum + option.price - (option.costPrice ?? 0), 0) * quote.quantity;
    const leasingProfit = (quote.funderCommission + quote.customerAdminFee - quote.fleetAllianceFee) * quote.quantity;
    const profitAmount = (quote.quoteType === "leasing" || quote.quoteType === "finance-lease") ? leasingProfit : quote.quoteType === "asset-finance" ? quote.financeCommission : profitInMetal + profitInDealerOptions;
    const deal = await createHubSpotQuoteDeal({
      quoteReference: quote.quoteReference || String(quote.quoteNumber),
      company: quote.customerCompany,
      vehicle: quote.quoteType === "asset-finance" ? quote.assetDetails : `${quote.vehicleMake} ${quote.vehicleModel}`.trim(),
      profitAmount,
      validUntil: quote.validUntil,
      createdByEmail: quote.createdByEmail,
      vehicleMake: quote.vehicleMake,
      vehicleModel: quote.quoteType === "asset-finance" ? quote.assetDetails : quote.vehicleModel,
      brand: quote.quoteType === "asset-finance" ? "Trek Finance" : "Automotivate",
      sourceOfRecord: quote.sourceOfRecord,
      contactEmail: quote.customerEmail,
      ownerId: quote.hubspotOwnerId || owner?.hubspotUserId,
      stageLabel: stageLabels[quote.status || ""] || "Customer Quoted",
    });
    await staffSanityClient.patch(id).set({
      hubspotStatus: "updated",
      hubspotUpdatedAt: new Date().toISOString(),
      hubspotUpdatedBy: session.name,
      hubspotDealId: deal?.id || "",
      hubspotError: "",
    }).commit();
  } catch (error) {
    const hubspotError = error instanceof Error ? error.message : "HubSpot could not be updated.";
    console.error("[staff-quotes:hubspot-retry]", error);
    await staffSanityClient.patch(id).set({ hubspotStatus: "failed", hubspotError }).commit();
  }
  return NextResponse.redirect(new URL(`/staff/quotes/${id}`, request.url), 303);
}
