import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getStaffSession, hashStaffPassword } from "../../lib/staffAuth";
import { staffAuditDocument } from "../../lib/staffAudit";
import { takeRateLimit, rateLimitResponse } from "../../lib/formSecurity";
import { staffDataEnvironment, staffSanityClient, staffScopeFilter, staffScopeParams } from "../../lib/staffSanity";

type SavedUser = { _id: string; name: string; email: string; role: string; active: boolean; hubspotUserId?: string; passwordHash?: string };

async function managementSession(request: Request) {
  const session = await getStaffSession();
  if (!session || session.role !== "management") return { error: NextResponse.json({ error: "Management access is required." }, { status: 403 }) };
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return { error: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) };
  return { session };
}

export async function POST(request: Request) {
  const limit = takeRateLimit(request, "staff-user-write", 30);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
  const authorised = await managementSession(request);
  if ("error" in authorised) return authorised.error;
  try {
    const body = await request.json();
    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 320);
    const hubspotUserId = String(body.hubspotUserId || "").trim();
    const password = String(body.password || "");
    const role = body.role === "management" ? "management" : "sales";
    const active = body.active !== false;
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a name and valid email address." }, { status: 400 });
    if (hubspotUserId && !/^\d{1,30}$/.test(hubspotUserId)) return NextResponse.json({ error: "Enter a valid numeric HubSpot User ID." }, { status: 400 });
    const existing = await staffSanityClient.fetch<SavedUser | null>(`*[_type == "staffUser" && ${staffScopeFilter} && lower(email) == $email][0]{_id,name,email,role,active,hubspotUserId,passwordHash}`, { email, ...staffScopeParams });
    if (!existing && password.length < 8) return NextResponse.json({ error: "Create a password with at least 8 characters." }, { status: 400 });
    if (password && password.length < 8) return NextResponse.json({ error: "The new password must contain at least 8 characters." }, { status: 400 });
    const id = existing?._id || `staffUser-${createHash("sha256").update(email).digest("hex").slice(0, 24)}`;
    const updated = { name, email, hubspotUserId, role, active };
    const passwordHash = password ? hashStaffPassword(password) : existing?.passwordHash;
    await staffSanityClient.transaction().createOrReplace({ _id: id, _type: "staffUser", portalEnvironment: staffDataEnvironment, ...updated, ...(passwordHash ? { passwordHash } : {}), updatedAt: new Date().toISOString(), updatedBy: authorised.session.email }).create(staffAuditDocument({ action: existing ? "user.updated" : "user.created", entityType: "user", entityId: id, summary: `${existing ? "Updated" : "Added"} portal user ${name}`, actorName: authorised.session.name, actorEmail: authorised.session.email, before: existing ? { name: existing.name, email: existing.email, hubspotUserId: existing.hubspotUserId, role: existing.role, active: existing.active } : undefined, after: updated })).commit();
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[staff-users]", error);
    return NextResponse.json({ error: "The user could not be saved." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const limit = takeRateLimit(request, "staff-user-delete", 15);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
  const authorised = await managementSession(request);
  if ("error" in authorised) return authorised.error;
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase().slice(0, 320);
    const id = String(body.id || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Choose a valid portal user." }, { status: 400 });
    if (email === authorised.session.email.toLowerCase()) return NextResponse.json({ error: "You cannot delete your own portal account." }, { status: 400 });
    const existing = id ? await staffSanityClient.fetch<SavedUser | null>(`*[_type == "staffUser" && _id == $id][0]{_id,name,email,role,active,hubspotUserId}`, { id }) : await staffSanityClient.fetch<SavedUser | null>(`*[_type == "staffUser" && ${staffScopeFilter} && lower(email) == $email][0]{_id,name,email,role,active,hubspotUserId}`, { email, ...staffScopeParams });
    if (existing && existing.email.toLowerCase() !== email) return NextResponse.json({ error: "The portal user could not be found." }, { status: 404 });
    const now = new Date().toISOString();
    const deletion = { name: existing?.name || email, email, role: existing?.role || "management", active: false, deletedAt: now, updatedAt: now, updatedBy: authorised.session.email };
    const deletedId = existing?._id || `staffUser-${createHash("sha256").update(email).digest("hex").slice(0, 24)}`;
    await staffSanityClient.transaction().createOrReplace({ _id: deletedId, _type: "staffUser", portalEnvironment: staffDataEnvironment, ...deletion }).create(staffAuditDocument({ action: "user.deleted", entityType: "user", entityId: deletedId, summary: `Deleted portal user ${deletion.name}`, actorName: authorised.session.name, actorEmail: authorised.session.email, before: existing || undefined, after: { email, active: false } })).commit();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[staff-users-delete]", error);
    return NextResponse.json({ error: "The user could not be deleted." }, { status: 500 });
  }
}
