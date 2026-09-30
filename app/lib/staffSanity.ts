import "server-only";
import { createClient } from "next-sanity";
import type { StaffRole } from "./staffAuth";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const staffSanityClient = createClient({ projectId, dataset, apiVersion: "2026-09-30", useCdn: false, token: process.env.SANITY_WRITE_TOKEN });
export const staffDataEnvironment: string = "production";
export const staffScopeParams = { portalEnvironment: staffDataEnvironment };
export const staffScopeFilter = "portalEnvironment == $portalEnvironment";
export const staffScopedId = (name: string) => `${name}-${staffDataEnvironment}`;

export function assertStaffServicesConfigured() {
  if (!projectId || !process.env.SANITY_WRITE_TOKEN) throw new Error("Staff portal services are not configured.");
}

export type StaffUser = { name: string; email: string; role: StaffRole; hubspotUserId?: string };

const initialAdministrator = (): StaffUser | null => {
  const email = String(process.env.INITIAL_ADMIN_EMAIL || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return null;
  return { name: String(process.env.INITIAL_ADMIN_NAME || "Portal Administrator").trim() || "Portal Administrator", email, role: "management" };
};

export async function getActiveStaffUsers() {
  return staffSanityClient.fetch<Array<StaffUser & { active: boolean }>>("*[_type == 'staffUser' && portalEnvironment == $portalEnvironment && active != false] | order(name asc){name,email,role,active}", staffScopeParams);
}

export async function getActiveStaffUser(email: string) {
  const saved = await staffSanityClient.fetch<(StaffUser & { active: boolean }) | null>("*[_type == 'staffUser' && portalEnvironment == $portalEnvironment && lower(email) == $email][0]{name,email,role,active}", { ...staffScopeParams, email: email.toLowerCase() });
  if (saved) return saved.active === false ? null : saved;
  const administrator = initialAdministrator();
  return administrator?.email === email.toLowerCase() ? administrator : null;
}