import { prisma } from "@/lib/prisma";
import { effectiveStatus } from "@/lib/invoice-status";

const invoiceInclude = {
  items: true,
  client: true,
  project: true,
  organization: true,
} as const;

type InvoiceWithRelations = {
  id: string;
  number: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE";
  issueDate: Date;
  dueDate: Date;
  currency: string;
  subtotal: { toString(): string };
  taxRate: { toString(): string };
  tax: { toString(): string };
  total: { toString(): string };
  notes: string | null;
  publicToken: string;
  sentAt: Date | null;
  paidAt: Date | null;
  client: { name: string; email: string; company: string | null; address: string | null };
  project: { name: string } | null;
  organization: { name: string };
  items: { description: string; quantity: { toString(): string }; unitPrice: { toString(): string }; amount: { toString(): string } }[];
};

function toPlain(invoice: InvoiceWithRelations) {
  const status = effectiveStatus(invoice.status, invoice.dueDate);
  return {
    id: invoice.id,
    number: invoice.number,
    status,
    rawStatus: invoice.status,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    currency: invoice.currency,
    subtotal: Number(invoice.subtotal.toString()),
    taxRate: Number(invoice.taxRate.toString()),
    tax: Number(invoice.tax.toString()),
    total: Number(invoice.total.toString()),
    notes: invoice.notes ?? "",
    publicToken: invoice.publicToken,
    sentAt: invoice.sentAt ? invoice.sentAt.toISOString() : null,
    paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
    client: {
      name: invoice.client.name,
      email: invoice.client.email,
      company: invoice.client.company ?? "",
      address: invoice.client.address ?? "",
    },
    project: invoice.project ? { name: invoice.project.name } : null,
    organization: { name: invoice.organization.name },
    items: invoice.items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity.toString()),
      unitPrice: Number(i.unitPrice.toString()),
      amount: Number(i.amount.toString()),
    })),
  };
}

export type InvoicePlain = ReturnType<typeof toPlain>;

export async function getInvoiceForOrg(organizationId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: invoiceInclude,
  });
  return invoice ? toPlain(invoice as unknown as InvoiceWithRelations) : null;
}

export async function getInvoiceByToken(publicToken: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken },
    include: invoiceInclude,
  });
  return invoice ? toPlain(invoice as unknown as InvoiceWithRelations) : null;
}