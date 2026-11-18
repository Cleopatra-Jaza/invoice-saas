import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvoiceByToken } from "@/lib/invoice-data";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-gray-900",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { paid?: string; canceled?: string };
}) {
  const invoice = await getInvoiceByToken(params.token);
  if (!invoice || invoice.rawStatus === "DRAFT") notFound();

  const canPay = invoice.status === "SENT" || invoice.status === "OVERDUE";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6 rounded-lg border border-slate-200 bg-white p-6">
        {searchParams.paid === "1" && invoice.status !== "PAID" ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            Payment received, updating...
          </div>
        ) : null}
        {searchParams.canceled === "1" ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-gray-700">
            Payment canceled.
          </div>
        ) : null}
        {invoice.status === "PAID" ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Paid on {invoice.paidAt ? invoice.paidAt.slice(0, 10) : "—"}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">{invoice.organization.name}</p>
            <h1 className="text-2xl font-semibold text-gray-900">Invoice {invoice.number}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusStyles[invoice.status] || ""}`}
              >
                {invoice.status}
              </span>
              <span className="text-sm text-gray-700">Due: {invoice.dueDate.slice(0, 10)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canPay ? (
              <form action={`/api/public/invoice/${params.token}/checkout`} method="POST">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                >
                  Pay now · {formatMoney(invoice.total, invoice.currency)}
                </button>
              </form>
            ) : null}
            <a
              href={`/api/public/invoice/${params.token}/pdf`}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Download PDF
            </a>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-700">Bill to</h2>
          <p className="mt-1 text-gray-900">{invoice.client.name}</p>
          {invoice.client.company ? <p className="text-sm text-gray-900">{invoice.client.company}</p> : null}
          <p className="text-sm text-gray-900">{invoice.client.email}</p>
          {invoice.client.address ? <p className="text-sm text-gray-900">{invoice.client.address}</p> : null}
        </div>

        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-gray-700">
              <tr>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 font-medium">Qty</th>
                <th className="px-4 py-2 font-medium">Unit price</th>
                <th className="px-4 py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-gray-900">{item.description}</td>
                  <td className="px-4 py-2 text-gray-900">{item.quantity}</td>
                  <td className="px-4 py-2 text-gray-900">
                    {formatMoney(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {formatMoney(item.amount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto max-w-sm space-y-1 text-sm">
          <div className="flex justify-between text-gray-900">
            <span>Subtotal</span>
            <span>{formatMoney(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-gray-900">
            <span>VAT ({invoice.taxRate}%)</span>
            <span>{formatMoney(invoice.tax, invoice.currency)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatMoney(invoice.total, invoice.currency)}</span>
          </div>
        </div>

        {invoice.notes ? (
          <div>
            <h2 className="text-sm font-medium text-gray-700">Notes</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{invoice.notes}</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}