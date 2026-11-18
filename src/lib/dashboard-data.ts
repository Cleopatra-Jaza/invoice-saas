import { prisma } from "@/lib/prisma";
import { syncOverdueInvoices } from "@/lib/invoice-status";

export type DashboardData = {
  currencies: string[];
  selectedCurrency: string;
  totalRevenue: number;
  pendingTotal: number;
  pendingCount: number;
  overdueTotal: number;
  overdueCount: number;
  monthlyRevenue: { label: string; revenue: number }[];
  recentInvoices: {
    id: string;
    number: string;
    clientName: string;
    total: number;
    status: string;
  }[];
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function getDashboardData(
  organizationId: string,
  requestedCurrency?: string
): Promise<DashboardData> {
  await syncOverdueInvoices(organizationId);

  const counts = await prisma.invoice.groupBy({
    by: ["currency"],
    where: { organizationId },
    _count: { _all: true },
  });
  const currencies = counts.map((c) => c.currency).sort();
  const mostUsed =
    [...counts].sort(
      (a, b) => b._count._all - a._count._all || a.currency.localeCompare(b.currency)
    )[0]?.currency ?? "GBP";

  const allowed = ["GBP", "USD", "EUR"];
  const currency =
    requestedCurrency && allowed.includes(requestedCurrency)
      ? requestedCurrency
      : mostUsed;

  const invoices = await prisma.invoice.findMany({
    where: { organizationId, currency },
    select: {
      id: true,
      number: true,
      status: true,
      total: true,
      paidAt: true,
      createdAt: true,
      client: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  let totalRevenue = 0;
  let pendingTotal = 0;
  let pendingCount = 0;
  let overdueTotal = 0;
  let overdueCount = 0;

  for (const inv of invoices) {
    const total = Number(inv.total);
    if (inv.status === "PAID") totalRevenue += total;
    if (inv.status === "SENT") {
      pendingTotal += total;
      pendingCount += 1;
    }
    if (inv.status === "OVERDUE") {
      overdueTotal += total;
      overdueCount += 1;
    }
  }

  const now = new Date();
  const months: { key: string; label: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleString("en-GB", { month: "short", year: "2-digit" }),
      revenue: 0,
    });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));
  for (const inv of invoices) {
    if (inv.status !== "PAID") continue;
    const date = inv.paidAt ?? inv.createdAt;
    const slot = byKey.get(monthKey(date));
    if (slot) slot.revenue += Number(inv.total);
  }

  const recentInvoices = invoices.slice(0, 5).map((inv) => ({
    id: inv.id,
    number: inv.number,
    clientName: inv.client.name,
    total: Number(inv.total),
    status: inv.status as string,
  }));

  return {
    currencies,
    selectedCurrency: currency,
    totalRevenue,
    pendingTotal,
    pendingCount,
    overdueTotal,
    overdueCount,
    monthlyRevenue: months.map((m) => ({ label: m.label, revenue: m.revenue })),
    recentInvoices,
  };
}
