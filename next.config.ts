import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Promoted from Report-Only to enforcing (Sept 2026). Note: the initial promotion broke
  // Sanity Studio at /admin in production, because connect-src only listed the bare
  // "api.sanity.io" host (not the per-project "<id>.api.sanity.io" subdomain Studio actually
  // calls) and script-src had no sanity-cdn.com entry at all for Studio's bridge.js. Fixed by
  // adding https://*.api.sanity.io, https://*.sanity-cdn.com to connect-src and
  // https://core.sanity-cdn.com to script-src. Console-based CSP verification before the
  // first promotion did not catch this: Chrome does not appear to surface connect-src/
  // script-src violation reports through the standard console API this was checked with, so
  // "no console violations" is not reliable evidence of a safe policy. Verify future changes
  // to this policy by live-testing every admin/consent-gated flow end-to-end, not by console-
  // watching alone.
  // CANDDi/Dynamo loads its bootstrap from cdns.dynamotracking.com, then uses
  // additional vendor subdomains for tracking requests and pixel delivery. Keep these
  // hosts scoped to CANDDi-owned domains rather than weakening the policy globally.
  // Sept 2026: added https://www.google.com to frame-src so the Aylesbury sourcing page's
  // Google Maps <iframe> embed renders (was previously blocked by the browser with no
  // console error, since frame-src only allowlisted the HubSpot hosts).
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.ahrefs.com https://www.clarity.ms https://cdns.dynamotracking.com https://*.dynamotracking.com https://*.dynamo-tracking.com https://*.canddi.com https://js-eu1.hs-scripts.com https://js.hs-scripts.com https://js.usemessages.com https://js.hscollectedforms.net https://js.hsforms.net https://js.hs-banner.com https://core.sanity-cdn.com",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://analytics.ahrefs.com https://www.clarity.ms https://*.clarity.ms https://cdns.dynamotracking.com https://*.dynamotracking.com https://*.dynamo-tracking.com https://*.canddi.com https://*.hubapi.com https://*.hubspot.com https://api.sanity.io https://*.api.sanity.io https://*.apicdn.sanity.io https://*.sanity-cdn.com wss://*.api.sanity.io",
      "img-src 'self' data: https://*.dynamotracking.com https://*.dynamo-tracking.com https://*.canddi.com https://cdn.sanity.io https://www.googletagmanager.com https://www.google-analytics.com https://*.hubspot.com https://forms.hsforms.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "frame-src 'self' https://*.hubspot.com https://app.hubspot.com https://www.google.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/staff-quotes/pdf": ["./public/automotivate-logo.png", "./public/automotivate-leasing-logo.png"],
    "/api/staff-quotes/[id]/pdf": ["./public/automotivate-logo.png", "./public/automotivate-leasing-logo.png"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2_678_400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/admin", destination: "/admin/automotivate/structure", permanent: false },
      { source: "/admin/structure", destination: "/admin/automotivate/structure", permanent: false },
      {
        source: "/:path*",
        has: [{ type: "host", value: "automotivate.co.uk" }],
        destination: "https://www.automotivate.co.uk/:path*",
        permanent: true,
      },
      { source: "/home", destination: "/", statusCode: 301 },
      { source: "/about-us", destination: "/about", statusCode: 301 },
      { source: "/blog", destination: "/news", statusCode: 301 },
      { source: "/broker", destination: "/", statusCode: 301 },
      { source: "/case-studies", destination: "/", statusCode: 301 },
      { source: "/contact-us", destination: "/contact", statusCode: 301 },
      { source: "/find-me-a-new-vehicle", destination: "/find-me-a-vehicle", statusCode: 301 },
      { source: "/fleet-news/:path*", destination: "/news", statusCode: 301 },
      { source: "/fleet-operations", destination: "/fleet-management", statusCode: 301 },
      { source: "/fuel-cards", destination: "/", statusCode: 301 },
      { source: "/how-it-works", destination: "/", statusCode: 301 },
      { source: "/legitimate-interests-assesment", destination: "/legitimate-interests", statusCode: 301 },
      { source: "/local-business", destination: "/commercial-vehicle-sourcing-aylesbury", statusCode: 301 },
      { source: "/meet-the-team", destination: "/", statusCode: 301 },
      { source: "/minibuses", destination: "/minibus", statusCode: 301 },
      { source: "/post/automotivate-group-acquired-by-trek-group", destination: "/news/automotivate-group-acquired-by-trek-group", statusCode: 301 },
      { source: "/sourcing", destination: "/vehicles", statusCode: 301 },
      { source: "/stock-vehicles", destination: "/stock", statusCode: 301 },
      { source: "/terms-and-conditions", destination: "/terms", statusCode: 301 },
      { source: "/trade-vehicles", destination: "/stock", statusCode: 301 },
      { source: "/used-stock-vehicles", destination: "/stock", statusCode: 301 },
      { source: "/van-packs", destination: "/conversions", statusCode: 301 },
      { source: "/vehicle-disposal", destination: "/fleet-services", statusCode: 301 },
      { source: "/vehicle-solutions", destination: "/conversions", statusCode: 301 },
      { source: "/stock-vehicles-1/:path*", destination: "/stock", statusCode: 301 },
      { source: "/buko-vehicles/:path*", destination: "/vehicles", statusCode: 301 },
      { source: "/brands/:path*", destination: "/leasing", statusCode: 301 },
    ];
  },
};

export default nextConfig;
