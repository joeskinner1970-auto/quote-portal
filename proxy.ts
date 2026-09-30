import { NextRequest, NextResponse } from "next/server";
import { SHACKLOCKS_ACCESS_COOKIE } from "./app/proposals/shacklocks/access";

const PRIMARY_ORIGIN = "https://www.automotivate.co.uk";
const SHACKLOCKS_FILE_PREFIX = "/proposals/shacklocks/files/";
const LEASING_HOSTS = new Set([
  "automotivateleasing.co.uk",
  "www.automotivateleasing.co.uk",
  "automotivateleasing.com",
  "www.automotivateleasing.com",
]);

const exactRedirects = new Map<string, string>([
  ["/", "/leasing"],
  ["/about", "/about"],
  ["/contact", "/leasing/contact"],
  ["/finance", "/leasing/finance"],
  ["/fleet-management", "/leasing/fleet-management"],
  ["/get-a-quote", "/leasing/quote"],
  ["/leasing-offers", "/leasing"],
  ["/fleet-news", "/news"],
  ["/terms", "/leasing/terms"],
  ["/privacy-policy", "/privacy-policy"],
  ["/cookie-policy", "/cookie-policy"],
  ["/commission-disclosure", "/leasing/commission-disclosure"],
  ["/modern-slavery-policy", "/modern-slavery-policy"],
  ["/leasing/privacy-policy", "/privacy-policy"],
  ["/leasing/cookie-policy", "/cookie-policy"],
  ["/leasing/modern-slavery-policy", "/modern-slavery-policy"],
  ["/leasing/offers", "/leasing"],
  ["/legitimate-interests-assesment", "/leasing/legitimate-interests"],
  ["/legitimate-interests-assessment", "/leasing/legitimate-interests"],
  ["/end-of-contract", "/leasing"],
  ["/faqs", "/leasing"],
  ["/toyota-corolla-commercial", "/leasing"],
  ["/vehicle-leasing-aylesbury", "/leasing/aylesbury"],
  ["/news/electric-vehicles-and-your-fleet", "/news/electric-vehicles-and-your-fleet"],
  ["/news/fleet-vehicle-renewal:-getting-the-timing,-finance-and-strategy-right", "/news/fleet-vehicle-renewal-strategy"],
  ["/news/the-complete-fleet-vehicle-guide-for-plant-&-tool-hire-businesses", "/news/fleet-vehicle-guide-for-plant-and-tool-hire-businesses"],
  ["/news/fuel-cards-vs-expense-claims:-what-is-actually-better-for-your-fleet", "/news/fuel-cards-vs-expense-claims-for-your-fleet"],
  ["/news/automotivate-group-acquired-by-trek-group", "/news/automotivate-group-acquired-by-trek-group"],
  ["/news/section-19-&-section-22-minibus-guide-for-schools-and-educational-institutions", "/news/section-19-and-22-minibus-guide-for-schools"],
  ["/news/commercial-vehicle-tax-&-funding-guide-uk-(2026)", "/news/commercial-vehicle-tax-and-funding-guide-uk-2026"],
  ["/news/commercial-vehicle-funding-solutions", "/news/commercial-vehicle-funding-solutions"],
  ["/news/downtime", "/news/downtime-and-van-selection"],
  ["/news/when-does-an-electric-van-actually-make-sense-for-your-fleet?", "/news/when-does-an-electric-van-make-sense-for-your-fleet"],
  ["/news/salary-sacrifice-explained", "/news/salary-sacrifice-explained"],
  ["/news/hidden-costs-of-managing-your-fleet-and-how-to-control-them", "/news/hidden-costs-of-managing-your-fleet"],
  ["/news/how-to-decide-between-leasing-and-buying-for-your-next-fleet-vehicle", "/news/leasing-vs-buying-your-next-fleet-vehicle"],
  ["/news/how-to-choose-the-right-commercial-vehicle-for-your-fleet", "/news/how-to-choose-the-right-commercial-vehicle-for-your-fleet"],
  ["/news/guide-to-understanding-car-financing-options", "/news/double-cab-pick-up-tax-and-alternatives"],
  ["/news/john-davidson-(pipes)-ltd", "/news"],
  ["/news/tj-lift-solutions", "/news"],
  ["/news/daniel-salmon", "/news"],
  ["/news/oxford-united-football-club", "/news"],
]);

function decodedPath(pathname: string) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

export function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const pathname = decodedPath(request.nextUrl.pathname);

  if (
    pathname.startsWith(SHACKLOCKS_FILE_PREFIX) &&
    request.cookies.get("shacklocks_proposal_access")?.value !== SHACKLOCKS_ACCESS_COOKIE
  ) {
    return NextResponse.redirect(new URL("/proposals/shacklocks", request.url), 307);
  }

  if (!LEASING_HOSTS.has(hostname)) return NextResponse.next();
  const isRetiredOffer = pathname.startsWith("/leasing/offers/");
  const destination = isRetiredOffer
    ? "/leasing"
    : exactRedirects.get(pathname) ??
      (pathname === "/leasing" || pathname.startsWith("/leasing/") ? pathname : "/leasing");

  return NextResponse.redirect(new URL(destination, PRIMARY_ORIGIN), 301);
}

export const config = {
  matcher: "/:path*",
};
