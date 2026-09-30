import { NextRequest, NextResponse } from "next/server";
import { getStaffSession } from "../../../../lib/staffAuth";
import { staffSanityClient, staffScopeFilter, staffScopeParams } from "../../../../lib/staffSanity";
import { staffAuditDocument } from "../../../../lib/staffAudit";

type WorkflowAction = "hubspot-complete" | "sharepoint-complete" | "hubspot-reopen" | "sharepoint-reopen";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession();
  if (!session) return NextResponse.redirect(new URL("/staff/login", request.url));
  const { id } = await params;
  const form = await request.formData();
  const action = String(form.get("action") || "") as WorkflowAction;
  if (!["hubspot-complete", "sharepoint-complete", "hubspot-reopen", "sharepoint-reopen"].includes(action)) {
    return NextResponse.json({ error: "Invalid workflow action." }, { status: 400 });
  }

  const quote = await staffSanityClient.fetch<{quoteReference?:string;quoteNumber:number;createdByEmail:string;hubspotStatus?:string;sharepointStatus?:string}|null>(
    `*[_type == "salesQuote" && _id == $id && ${staffScopeFilter}][0]{quoteReference,quoteNumber,createdByEmail,hubspotStatus,sharepointStatus}`,
    { id, ...staffScopeParams },
  );
  if (!quote || (session.role !== "management" && quote.createdByEmail.toLowerCase() !== session.email.toLowerCase())) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const isHubSpot = action.startsWith("hubspot");
  const complete = action.endsWith("complete");
  const statusField = isHubSpot ? "hubspotStatus" : "sharepointStatus";
  const atField = isHubSpot ? "hubspotUpdatedAt" : "sharepointSavedAt";
  const byField = isHubSpot ? "hubspotUpdatedBy" : "sharepointSavedBy";
  const beforeStatus = isHubSpot ? quote.hubspotStatus || "awaiting-update" : quote.sharepointStatus || "awaiting-save";
  const afterStatus = complete ? (isHubSpot ? "updated" : "saved") : (isHubSpot ? "awaiting-update" : "awaiting-save");
  const patch = complete
    ? { [statusField]: afterStatus, [atField]: now, [byField]: session.email }
    : { [statusField]: afterStatus, [atField]: null, [byField]: null };
  const service = isHubSpot ? "HubSpot" : "SharePoint";
  const reference = quote.quoteReference || quote.quoteNumber;

  await staffSanityClient.transaction()
    .patch(id, builder => builder.set(patch))
    .create(staffAuditDocument({
      action: complete ? `quote.${isHubSpot ? "hubspot_updated" : "sharepoint_saved"}` : `quote.${isHubSpot ? "hubspot_reopened" : "sharepoint_reopened"}`,
      entityType: "quote",
      entityId: id,
      summary: complete ? `Quote ${reference} marked as completed in ${service}` : `Quote ${reference} returned to the ${service} queue`,
      actorName: session.name,
      actorEmail: session.email,
      before: { [statusField]: beforeStatus },
      after: { [statusField]: afterStatus },
    }))
    .commit();

  return NextResponse.redirect(new URL(`/staff/quotes/${id}`, request.url), 303);
}

