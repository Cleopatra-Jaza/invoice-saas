export const FREE_INVOICE_LIMIT = 5;

import { prisma } from "@/lib/prisma";

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getMonthlyInvoiceCount(organizationId: string) {
  return prisma.invoice.count({
    where: {
      organizationId,
      createdAt: { gte: startOfMonth() },
    },
  });
}

export async function canCreateInvoice(organizationId: string, plan: "FREE" | "PRO") {
  if (plan === "PRO") {
    return { allowed: true, used: 0, limit: null as number | null };
  }
  const used = await getMonthlyInvoiceCount(organizationId);
  return {
    allowed: used < FREE_INVOICE_LIMIT,
    used,
    limit: FREE_INVOICE_LIMIT,
  };
}
