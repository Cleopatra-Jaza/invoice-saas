import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import DeleteInvoiceButton from "../DeleteInvoiceButton";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: { orgSlug: string; invoiceId: string };
}) {
  const { organizationId } = await requireOrg(params.orgSlug);
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, organizationId },
    include: {
      client: true,
      items: true,
    },
  });

  if (!invoice) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoice {invoice.number}</h1>
          <div className="mt-1">
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusStyles[invoice.status] || ""}`}>
              {invoice.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${params.orgSlug}/invoices`} className="text-sm text-slate-700 hover:underline">
            Back
          </Link>
          {invoice.status === "DRAFT" ? (
            <>
              <Link
                href={`/${params.orgSlug}/invoices/${invoice.id}/edit`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Edit
              </Link>
              <DeleteInvoiceButton orgSlug={params.orgSlug} invoiceId={invoice.id} />
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-slate-500">Client</h2>
          <p className="mt-1 text-slate-900">{invoice.client.name}</p>
          <p className="text-sm text-slate-700">{invoice.client.email}</p>
        </div>
        <div className="text-sm text-slate-700">
          <p><span className="font-medium">Issue date:</span> {invoice.issueDate.toISOString().slice(0, 10)}</p>
          <p><span className="font-medium">Due date:</span> {invoice.dueDate.toISOString().slice(0, 10)}</p>
          <p><span className="font-medium">Currency:</span> {invoice.currency}</p>
          <p><span className="font-medium">VAT rate:</span> {invoice.taxRate.toString()}%</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Unit price</th>
              <th className="px-4 py-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-900">{item.description}</td>
                <td className="px-4 py-3 text-slate-700">{item.quantity.toString()}</td>
                <td className="px-4 py-3 text-slate-700">{formatMoney(item.unitPrice.toString(), invoice.currency)}</td>
                <td className="px-4 py-3 text-slate-700">{formatMoney(item.amount.toString(), invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ml-auto max-w-sm rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(invoice.subtotal.toString(), invoice.currency)}</span></div>
        <div className="mt-1 flex justify-between"><span>VAT</span><span>{formatMoney(invoice.tax.toString(), invoice.currency)}</span></div>
        <div className="mt-2 flex justify-between font-semibold text-slate-900"><span>Total</span><span>{formatMoney(invoice.total.toString(), invoice.currency)}</span></div>
      </div>

      {invoice.notes ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <h2 className="font-medium text-slate-900">Notes</h2>
          <p className="mt-1 whitespace-pre-wrap text-slate-700">{invoice.notes}</p>
        </div>
      ) : null}
    </div>
  );
}