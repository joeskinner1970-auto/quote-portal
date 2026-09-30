import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const IDEMPOTENCY_WINDOW_MS = 10 * 60 * 1000;
const MAX_RATE_LIMIT_ENTRIES = 5_000;

const globalFormSecurity = globalThis as typeof globalThis & {
  automotivateFormRateLimits?: Map<string, RateLimitEntry>;
};

const rateLimits =
  globalFormSecurity.automotivateFormRateLimits ??
  new Map<string, RateLimitEntry>();

globalFormSecurity.automotivateFormRateLimits = rateLimits;

function anonymisedClientKey(request: Request, scope: string) {
  const forwardedAddress =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const clientAddress = forwardedAddress.split(",")[0]?.trim() || "unknown";

  return createHash("sha256").update(`${scope}:${clientAddress}`).digest("hex");
}

function pruneExpiredRateLimits(now: number) {
  if (rateLimits.size < MAX_RATE_LIMIT_ENTRIES) return;

  for (const [key, entry] of rateLimits) {
    if (entry.resetAt <= now) rateLimits.delete(key);
  }

  while (rateLimits.size >= MAX_RATE_LIMIT_ENTRIES) {
    const oldestKey = rateLimits.keys().next().value;
    if (!oldestKey) break;
    rateLimits.delete(oldestKey);
  }
}

export function takeRateLimit(
  request: Request,
  scope: string,
  limit = 5,
): RateLimitResult {
  const now = Date.now();
  pruneExpiredRateLimits(now);

  const key = anonymisedClientKey(request, scope);
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true };
}

export function submissionDocumentId(
  scope: string,
  fields: Record<string, unknown>,
) {
  const window = Math.floor(Date.now() / IDEMPOTENCY_WINDOW_MS);
  const digest = createHash("sha256")
    .update(JSON.stringify({ scope, window, fields }))
    .digest("hex");

  return `form-submission.${scope}.${window}.${digest}`;
}

export function reportFormError(scope: string, error: unknown) {
  const reference = randomUUID();

  console.error("Form submission failed", {
    scope,
    reference,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });

  return reference;
}

export function noStoreJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("Pragma", "no-cache");

  return NextResponse.json(body, { ...init, headers });
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return noStoreJson(
    { error: "Too many submissions. Please wait before trying again." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}
