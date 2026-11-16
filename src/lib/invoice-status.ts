import type { InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function effectiveStatus(
  status: InvoiceStatus,
  dueDate: Date,
  now: Date = new Date()
): InvoiceStatus {
  if (status === "SENT" && dueDate < startOfToday(now)) {
    return "OVERDUE";
  }
  return status;
}

export function startOfToday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function syncOverdueInvoices(organizationId: string) {
  await prisma.invoice.updateMany({
    where: {
      organizationId,
      status: "SENT",
      dueDate: { lt: startOfToday() },
    },
    data: { status: "OVERDUE" },
  });
}
