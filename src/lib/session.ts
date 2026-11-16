// RULE: every future tenant query must use organizationId returned by requireOrg(),
// NEVER accept or trust organizationId from client input (params/body/query) for data access.

import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireOrg(orgSlug: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
    },
    include: { organization: true },
  });

  if (!membership) {
    notFound();
  }

  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    organization: membership.organization,
    role: membership.role,
  };
}

export async function getUserOrganizations(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => m.organization);
}
