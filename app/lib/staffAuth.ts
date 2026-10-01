import "server-only";
import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type StaffRole = "sales" | "management";
export type StaffSession = { email: string; name: string; role: StaffRole; hubspotUserId?: string; expiresAt: number };
export const STAFF_SESSION_COOKIE = "auto_quote_staff_session";

function secret() { const value = process.env.STAFF_SESSION_SECRET; if (!value) throw new Error("Staff portal security is not configured."); return value; }
function encode(value: string) { return Buffer.from(value).toString("base64url"); }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }
export function createStaffSession(input: Omit<StaffSession, "expiresAt">) { const session = { ...input, expiresAt: Date.now() + 8 * 60 * 60 * 1000 }; const payload = encode(JSON.stringify(session)); return `${payload}.${sign(payload)}`; }
export function readStaffSessionValue(value?: string): StaffSession | null { if (!value) return null; const [payload, suppliedSignature] = value.split("."); if (!payload || !suppliedSignature) return null; const expected = Buffer.from(sign(payload)); const supplied = Buffer.from(suppliedSignature); if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null; try { const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as StaffSession; return session.email && session.name && ["sales", "management"].includes(session.role) && session.expiresAt >= Date.now() ? session : null; } catch { return null; } }
export async function getStaffSession() { return readStaffSessionValue((await cookies()).get(STAFF_SESSION_COOKIE)?.value); }
export function createLoginCode() { return String(randomInt(100000, 1000000)); }
export function hashLoginCode(email: string, code: string) { return createHmac("sha256", secret()).update(`${email.toLowerCase()}:${code}`).digest("hex"); }
export function safeEquals(left: string, right: string) { const a = Buffer.from(left), b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); }
export function hashStaffPassword(password: string) { const salt = randomBytes(16).toString("hex"); const hash = scryptSync(password, salt, 64).toString("hex"); return `scrypt:${salt}:${hash}`; }
export function verifyStaffPassword(password: string, stored: string) { const [version, salt, expectedHex] = stored.split(":"); if (version !== "scrypt" || !salt || !expectedHex) return false; try { const expected = Buffer.from(expectedHex, "hex"), supplied = scryptSync(password, salt, expected.length); return expected.length > 0 && expected.length === supplied.length && timingSafeEqual(expected, supplied); } catch { return false; } }