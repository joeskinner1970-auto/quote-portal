import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { getStaffSession } from "../../../lib/staffAuth";
import { createFallbackQuotePdf, createQuotePdf } from "../../../staff/quotes/quotePdf";
import { sanitiseQuote, validateQuote } from "../../../staff/quotes/quote";
import { rateLimitResponse, takeRateLimit } from "../../../lib/formSecurity";

export async function POST(request: Request) {
  const rateLimit = takeRateLimit(request, "staff-quote-pdf", 40); if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);
  const session = await getStaffSession(); if (!session) return NextResponse.json({ error: "Sign in again to download this PDF." }, { status: 401 });
  const quote = sanitiseQuote(await request.json()), error = validateQuote(quote); if (error) return NextResponse.json({ error }, { status: 400 });
  try {
    const pdf = await createQuotePdf(quote, { salesperson: session.name, salesEmail: session.email, draft: true });
    return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=\"Automotivate-draft-quote.pdf\"", "Cache-Control": "private, no-store" } });
  } catch (fullError) {
    console.error("[staff-quotes:draft-pdf]", fullError);
    try { const pdf = await createFallbackQuotePdf(quote, { salesperson: session.name, salesEmail: session.email, draft: true }); return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=\"Automotivate-draft-quote.pdf\"", "Cache-Control": "private, no-store" } }); }
    catch (fallbackError) { console.error("[staff-quotes:draft-pdf-fallback]", fallbackError); return NextResponse.json({ error: "The PDF could not be created. Please try again." }, { status: 500 }); }
  }
}