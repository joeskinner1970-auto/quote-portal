import { NextResponse } from "next/server";
import { STAFF_SESSION_COOKIE } from "../../../lib/staffAuth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/staff/login", request.url), 303);
  response.cookies.set(STAFF_SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}

