import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { effectiveStatus, syncOverdueInvoices } from "@/lib/invoice-status";
import type { InvoiceStatus } from "@prisma/client";
import { getMonthlyInvoiceCount, FREE_INVOICE_LIMIT } from "@/lib/plan";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-gray-900",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

const allowedStatuses: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "OVERDUE"];

export default async function InvoicesPage({
  params,
  searchParams,
}: {
  params: { orgSlug: string };
  searchParams: { q?: string; status?: string };
}) {
  const { organizationId, organization } = await requireOrg(params.orgSlug);
  await syncOverdueInvoices(organizationId);
  const q = (searchParams.q || "").trim();
  const statusParam = (searchParams.status || "").trim();
  const statusFilter = allowedStatuses.includes(statusParam as InvoiceStatus)
    ? (statusParam as InvoiceStatus)
    : undefined;

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q ? { number: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const monthlyUsed =
    organization.plan === "FREE"
      ? await getMonthlyInvoiceCount(organizationId)
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-700">
            {organization.plan === "PRO"
              ? "Unlimited"
              : `${monthlyUsed}/${FREE_INVOICE_LIMIT} invoices this month`}
          </p>
        </div>
        <Link
          href={`/${params.orgSlug}/invoices/new`}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New invoice
        </Link>
      </div>
      <form className="flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by number"
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          autoComplete="off"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="SENT">SENT</option>
          <option value="PAID">PAID</option>
          <option value="OVERDUE">OVERDUE</option>
        </select>
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm text-gray-900 hover:bg-slate-50">
          Filter
        </button>
      </form>
      {invoices.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-gray-700">
          No invoices found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Issue date</th>
                <th className="px-4 py-3 font-medium">Due date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">View</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const status = effectiveStatus(inv.status, inv.dueDate);
                return (
                  <tr key={inv.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <Link
                        href={`/${params.orgSlug}/invoices/${inv.id}`}
                        className="font-medium text-blue-700 underline hover:text-blue-800"
                      >
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{inv.client.name}</td>
                    <td className="px-4 py-3 text-gray-900">{inv.issueDate.toISOString().slice(0, 10)}</td>
                    <td className="px-4 py-3 text-gray-900">{inv.dueDate.toISOString().slice(0, 10)}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {formatMoney(inv.total.toString(), inv.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusStyles[status] || ""}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${params.orgSlug}/invoices/${inv.id}`}
                        className="text-sm text-blue-700 underline hover:text-blue-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}