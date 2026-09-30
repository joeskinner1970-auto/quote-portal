import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ error: "Email code sign-in is disabled." }, { status: 410 }); }