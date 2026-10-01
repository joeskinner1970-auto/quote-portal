import { NextResponse } from "next/server";
import { createStaffSession, safeEquals, STAFF_SESSION_COOKIE, verifyStaffPassword } from "../../../lib/staffAuth";
import { takeRateLimit, rateLimitResponse } from "../../../lib/formSecurity";
import { staffSanityClient, staffScopeFilter, staffScopeParams } from "../../../lib/staffSanity";

type LoginUser = { email: string; name: string; role: "sales" | "management"; active: boolean; hubspotUserId?: string; passwordHash?: string };

export async function POST(request: Request) {
  const limit = takeRateLimit(request, "staff-login", 12);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
  try {
    const body = await request.json();
    const password = String(body.password || "");
    const email = String(body.email || "").trim().toLowerCase();
    const initialEmail = String(process.env.INITIAL_ADMIN_EMAIL || "").trim().toLowerCase();
    const initialPassword = String(process.env.STAFF_ADMIN_PASSWORD || "");
    const initialName = String(process.env.INITIAL_ADMIN_NAME || "Portal Administrator").trim() || "Portal Administrator";
    let user: LoginUser | null = null;
    if (email && email === initialEmail && initialPassword && safeEquals(password, initialPassword)) user = { email: initialEmail, name: initialName, role: "management", active: true };
    if (!user && email) {
      const saved = await staffSanityClient.fetch<LoginUser | null>(`*[_type == "staffUser" && ${staffScopeFilter} && lower(email) == $email && active == true && !defined(deletedAt)][0]{email,name,role,active,hubspotUserId,passwordHash}`, { email, ...staffScopeParams });
      if (saved?.passwordHash && verifyStaffPassword(password, saved.passwordHash)) user = saved;
    }
    if (!user) return NextResponse.json({ error: "The email address or password is incorrect." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(STAFF_SESSION_COOKIE, createStaffSession({ email: user.email, name: user.name, role: user.role, ...(user.hubspotUserId ? { hubspotUserId: user.hubspotUserId } : {}) }), { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 8 * 60 * 60 });
    return response;
  } catch (error) {
    console.error("[staff-auth:login]", error);
    return NextResponse.json({ error: "We could not sign you in. Please try again." }, { status: 500 });
  }
}