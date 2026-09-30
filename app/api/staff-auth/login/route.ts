import { NextResponse } from "next/server";
import { createStaffSession, safeEquals, STAFF_SESSION_COOKIE } from "../../../lib/staffAuth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const expected = String(process.env.STAFF_ADMIN_PASSWORD || "");
    const email = String(process.env.INITIAL_ADMIN_EMAIL || "").trim().toLowerCase();
    const name = String(process.env.INITIAL_ADMIN_NAME || "Portal Administrator").trim() || "Portal Administrator";
    if (!expected || !email || !safeEquals(String(password || ""), expected)) return NextResponse.json({ error: "The password is incorrect." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(STAFF_SESSION_COOKIE, createStaffSession({ email, name, role: "management" }), { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 8 * 60 * 60 });
    return response;
  } catch {
    return NextResponse.json({ error: "We could not sign you in. Please try again." }, { status: 500 });
  }
}