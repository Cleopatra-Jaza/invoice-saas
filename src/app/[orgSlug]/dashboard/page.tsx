import Link from "next/link";
import { requireOrg } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { getDashboardData } from "@/lib/dashboard-data";
import SignOutButton from "../SignOutButton";
import RevenueChart from "./RevenueChart";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-gray-900",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export default async function OrgDashboardPage({
  params,
  searchParams,
}: {
  params: { orgSlug: string };
  searchParams: { currency?: string };
}) {
  const { organizationId, organization, role } = await requireOrg(params.orgSlug);
  const data = await getDashboardData(organizationId, searchParams.currency);
  const currency = data.selectedCurrency;
  const hasInvoices = data.currencies.length > 0;

  if (!hasInvoices) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Welcome to {organization.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-gray-900">
                {organization.plan}
              </span>
              <span>Role: {role}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${params.orgSlug}/invoices/new`}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              New invoice
            </Link>
            <Link
              href={`/${params.orgSlug}/clients/new`}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-slate-50"
            >
              New client
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-gray-700">No invoices yet.</p>
          <Link
            href={`/${params.orgSlug}/invoices/new`}
            className="mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create your first invoice
          </Link>
        </div>
        <div className="sm:hidden">
          <SignOutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome to {organization.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700">
            <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-gray-900">
              {organization.plan}
            </span>
            <span>Role: {role}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/${params.orgSlug}/invoices/new`}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New invoice
          </Link>
          <Link
            href={`/${params.orgSlug}/clients/new`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-slate-50"
          >
            New client
          </Link>
        </div>
      </div>

      {data.currencies.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-gray-700">Currency:</span>
          {data.currencies.map((c) => (
            <Link
              key={c}
              href={`/${params.orgSlug}/dashboard?currency=${c}`}
              className={`rounded-md border px-3 py-1 ${
                c === currency
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 text-gray-900 hover:bg-slate-50"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-green-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-700">Total Revenue</p>
          <p className="mt-2 text-2xl font-semibold text-green-700">
            {formatMoney(data.totalRevenue, currency)}
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-700">Pending</p>
          <p className="mt-2 text-2xl font-semibold text-blue-700">
            {formatMoney(data.pendingTotal, currency)}
          </p>
          <p className="mt-1 text-xs text-gray-700">{data.pendingCount} invoice(s)</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-700">Overdue</p>
          <p className="mt-2 text-2xl font-semibold text-red-700">
            {formatMoney(data.overdueTotal, currency)}
          </p>
          <p className="mt-1 text-xs text-gray-700">{data.overdueCount} invoice(s)</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-800">Revenue last 6 months</h2>
        <div className="mt-3">
          <RevenueChart data={data.monthlyRevenue} currency={currency} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-800">Recent invoices</h2>
          <Link href={`/${params.orgSlug}/invoices`} className="text-sm text-slate-900 underline">
            View all
          </Link>
        </div>
        {data.recentInvoices.length === 0 ? (
          <p className="mt-3 text-sm text-gray-700">No invoices in {currency} yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-gray-700">
                <tr>
                  <th className="px-3 py-2 font-medium">Number</th>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <Link
                        href={`/${params.orgSlug}/invoices/${inv.id}`}
                        className="font-medium text-blue-700 underline hover:text-blue-800"
                      >
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-gray-900">{inv.clientName}</td>
                    <td className="px-3 py-2 text-gray-900">
                      {formatMoney(inv.total, currency)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          statusStyles[inv.status] || "bg-slate-100 text-gray-900"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="sm:hidden">
        <SignOutButton />
      </div>
    </div>
  );
}
