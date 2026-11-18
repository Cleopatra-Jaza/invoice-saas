import { requireOrg } from "@/lib/session";

export async function requireOwner(orgSlug: string) {
  const ctx = await requireOrg(orgSlug);
  return {
    ...ctx,
    isOwner: ctx.role === "OWNER",
  };
}
