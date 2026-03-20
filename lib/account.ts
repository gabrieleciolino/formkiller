import type { Database } from "@/lib/db/supabase.types";

export type AccountRole = Database["public"]["Enums"]["account_role"];
export type AccountTier = Database["public"]["Enums"]["account_tier"];

export const DEFAULT_ACCOUNT_ROLE: AccountRole = "user";
export const DEFAULT_ACCOUNT_TIER: AccountTier = "free";

export function isAdminRole(role: AccountRole) {
  return role === "admin";
}

export function canUseProFeatures({
  role,
  tier,
}: {
  role: AccountRole;
  tier: AccountTier;
}) {
  return role === "admin" || tier === "pro";
}
