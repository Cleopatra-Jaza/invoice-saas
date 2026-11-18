import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { effectiveStatus, syncOverdueInvoices } from "@/lib/invoice-status";
import DeleteInvoiceButton from "../DeleteInvoiceButton";
import InvoiceStatusActions from "../InvoiceStatusActions";
import CopyPublicLink from "./CopyPublicLink";
import EmailInvoiceButton from "./EmailInvoiceButton";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-gray-900",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: { orgSlug: string; invoiceId: string };
}) {
  const { organizationId, role } = await requireOrg(params.orgSlug);
  await syncOverdueInvoices(organizationId);
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, organizationId },
    include: {
      client: true,
      project: { select: { name: true } },
      items: true,
    },
  });

  if (!invoice) notFound();
  const status = effectiveStatus(invoice.status, invoice.dueDate);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicUrl = `${appUrl}/invoice/${invoice.publicToken}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoice {invoice.number}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusStyles[status] || ""}`}>
              {status}
            </span>
            {invoice.sentAt ? (
              <span className="text-xs text-gray-600">Sent: {invoice.sentAt.toISOString().slice(0, 10)}</span>
            ) : null}
            {invoice.paidAt ? (
              <span className="text-xs text-gray-600">Paid: {invoice.paidAt.toISOString().slice(0, 10)}</span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/invoices/${invoice.id}/pdf?org=${params.orgSlug}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-gray-900 hover:bg-slate-50"
            >
              Download PDF
            </a>
            <Link href={`/${params.orgSlug}/invoices`} className="text-sm text-gray-900 hover:underline">
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
                {role === "OWNER" ? (
                  <DeleteInvoiceButton orgSlug={params.orgSlug} invoiceId={invoice.id} />
                ) : null}
              </>
            ) : null}
          </div>
          <InvoiceStatusActions orgSlug={params.orgSlug} invoiceId={invoice.id} status={status} />
        </div>
      </div>

      <EmailInvoiceButton
        orgSlug={params.orgSlug}
        invoiceId={invoice.id}
        clientEmail={invoice.client.email}
      />

      {invoice.status !== "DRAFT" ? <CopyPublicLink url={publicUrl} /> : null}

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-gray-700">Client</h2>
          <p className="mt-1 text-slate-900">{invoice.client.name}</p>
          <p className="text-sm text-gray-900">{invoice.client.email}</p>
          {invoice.project ? (
            <p className="mt-2 text-sm text-gray-900"><span className="font-medium">Project:</span> {invoice.project.name}</p>
          ) : null}
        </div>
        <div className="text-sm text-gray-900">
          <p><span className="font-medium">Issue date:</span> {invoice.issueDate.toISOString().slice(0, 10)}</p>
          <p><span className="font-medium">Due date:</span> {invoice.dueDate.toISOString().slice(0, 10)}</p>
          <p><span className="font-medium">Currency:</span> {invoice.currency}</p>
          <p><span className="font-medium">VAT rate:</span> {invoice.taxRate.toString()}%</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-gray-700">
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
                <td className="px-4 py-3 text-gray-900">{item.quantity.toString()}</td>
                <td className="px-4 py-3 text-gray-900">{formatMoney(item.unitPrice.toString(), invoice.currency)}</td>
                <td className="px-4 py-3 text-gray-900">{formatMoney(item.amount.toString(), invoice.currency)}</td>
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
          <p className="mt-1 whitespace-pre-wrap text-gray-900">{invoice.notes}</p>
        </div>
      ) : null}
    </div>
  );
}
