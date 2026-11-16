import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import InvoiceForm from "../../InvoiceForm";
import { updateInvoice } from "../../actions";

export default async function EditInvoicePage({
  params,
}: {
  params: { orgSlug: string; invoiceId: string };
}) {
  const { organizationId } = await requireOrg(params.orgSlug);
  const [invoice, clients] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id: params.invoiceId, organizationId },
      include: { items: true },
    }),
    prisma.client.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!invoice) notFound();
  if (invoice.status !== "DRAFT") notFound();

  const action = updateInvoice.bind(null, params.orgSlug, params.invoiceId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Edit invoice {invoice.number}</h1>
        <Link href={`/${params.orgSlug}/invoices/${invoice.id}`} className="text-sm text-slate-700 hover:underline">
          Back to invoice
        </Link>
      </div>
      <InvoiceForm
        orgSlug={params.orgSlug}
        clients={clients}
        action={action}
        submitLabel="Save changes"
        initialValues={{
          clientId: invoice.clientId,
          dueDate: invoice.dueDate.toISOString().slice(0, 10),
          currency: invoice.currency,
          taxRate: Number(invoice.taxRate.toString()),
          notes: invoice.notes ?? "",
          items: invoice.items.map((i) => ({
            description: i.description,
            quantity: Number(i.quantity.toString()),
            unitPrice: Number(i.unitPrice.toString()),
          })),
        }}
      />
    </div>
  );
}