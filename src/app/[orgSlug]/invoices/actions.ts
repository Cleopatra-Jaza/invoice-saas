"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { calcTotals } from "@/lib/money";
import { invoiceSchema, type InvoiceInput } from "@/lib/validations/invoice";

export type InvoiceFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

function parseNumber(invoiceNumber: string): number {
  const m = invoiceNumber.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

function parsePayload(formData: FormData): InvoiceInput | null {
  const raw = formData.get("payload");
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as InvoiceInput;
  } catch {
    return null;
  }
}

async function nextInvoiceNumber(
  tx: Prisma.TransactionClient,
  organizationId: string
): Promise<string> {
  const invoices = await tx.invoice.findMany({
    where: { organizationId },
    select: { number: true },
  });
  const max = invoices.reduce((acc, inv) => Math.max(acc, parseNumber(inv.number)), 0);
  return `INV-${String(max + 1).padStart(4, "0")}`;
}

async function assertProject(orgId: string, projectId?: string | null) {
  if (!projectId) return null;
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true },
  });
  return project ? project.id : "invalid";
}

export async function createInvoice(
  orgSlug: string,
  _prevState: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const { organizationId } = await requireOrg(orgSlug);
  const payload = parsePayload(formData);
  if (!payload) return { message: "Invalid form data." };

  const parsed = invoiceSchema.safeParse(payload);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const client = await prisma.client.findFirst({
    where: { id: data.clientId, organizationId },
    select: { id: true },
  });
  if (!client) {
    return { message: "Selected client is invalid." };
  }

  const projectId = data.projectId || null;
  if (projectId) {
    const proj = await assertProject(organizationId, projectId);
    if (proj === "invalid") return { message: "Selected project is invalid." };
  }

  const totals = calcTotals(data.items, data.taxRate);
  const dueDate = new Date(data.dueDate);
  let created = false;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.$transaction(async (tx) => {
        const number = await nextInvoiceNumber(tx, organizationId);
        await tx.invoice.create({
          data: {
            organizationId,
            clientId: data.clientId,
            projectId,
            number,
            status: "DRAFT",
            dueDate,
            currency: data.currency,
            subtotal: totals.subtotal,
            taxRate: data.taxRate,
            tax: totals.tax,
            total: totals.total,
            notes: data.notes || null,
            items: {
              create: totals.items.map((i, idx) => ({
                description: data.items[idx].description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                amount: i.amount,
              })),
            },
          },
        });
      });
      created = true;
      break;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < 2
      ) {
        continue;
      }
      return { message: "Failed to create invoice." };
    }
  }

  if (!created) {
    return { message: "Failed to create invoice." };
  }

  revalidatePath(`/${orgSlug}/invoices`);
  redirect(`/${orgSlug}/invoices`);
}

export async function updateInvoice(
  orgSlug: string,
  invoiceId: string,
  _prevState: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const { organizationId } = await requireOrg(orgSlug);
  const payload = parsePayload(formData);
  if (!payload) return { message: "Invalid form data." };

  const parsed = invoiceSchema.safeParse(payload);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    select: { id: true, status: true },
  });
  if (!existing) return { message: "Invoice not found." };
  if (existing.status !== "DRAFT") {
    return { message: "Only draft invoices can be edited." };
  }

  const client = await prisma.client.findFirst({
    where: { id: data.clientId, organizationId },
    select: { id: true },
  });
  if (!client) return { message: "Selected client is invalid." };

  const projectId = data.projectId || null;
  if (projectId) {
    const proj = await assertProject(organizationId, projectId);
    if (proj === "invalid") return { message: "Selected project is invalid." };
  }

  const totals = calcTotals(data.items, data.taxRate);
  const dueDate = new Date(data.dueDate);

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        clientId: data.clientId,
        projectId,
        dueDate,
        currency: data.currency,
        subtotal: totals.subtotal,
        taxRate: data.taxRate,
        tax: totals.tax,
        total: totals.total,
        notes: data.notes || null,
      },
    });
    await tx.invoiceItem.deleteMany({ where: { invoiceId } });
    await tx.invoiceItem.createMany({
      data: totals.items.map((i, idx) => ({
        invoiceId,
        description: data.items[idx].description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        amount: i.amount,
      })),
    });
  });

  revalidatePath(`/${orgSlug}/invoices`);
  revalidatePath(`/${orgSlug}/invoices/${invoiceId}`);
  redirect(`/${orgSlug}/invoices/${invoiceId}`);
}

export async function deleteInvoice(
  orgSlug: string,
  invoiceId: string
): Promise<{ message?: string }> {
  const { organizationId } = await requireOrg(orgSlug);
  const existing = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    select: { status: true },
  });
  if (!existing) return { message: "Invoice not found." };
  if (existing.status !== "DRAFT") {
    return { message: "Only draft invoices can be deleted." };
  }

  await prisma.invoice.deleteMany({ where: { id: invoiceId, organizationId } });
  revalidatePath(`/${orgSlug}/invoices`);
  return {};
}

export async function markInvoiceSent(
  orgSlug: string,
  invoiceId: string
): Promise<{ message?: string }> {
  const { organizationId } = await requireOrg(orgSlug);
  const result = await prisma.invoice.updateMany({
    where: { id: invoiceId, organizationId, status: "DRAFT" },
    data: { status: "SENT", sentAt: new Date() },
  });
  if (result.count === 0) return { message: "Invalid status transition." };
  revalidatePath(`/${orgSlug}/invoices`);
  revalidatePath(`/${orgSlug}/invoices/${invoiceId}`);
  return {};
}

export async function markInvoicePaid(
  orgSlug: string,
  invoiceId: string
): Promise<{ message?: string }> {
  const { organizationId } = await requireOrg(orgSlug);
  const result = await prisma.invoice.updateMany({
    where: {
      id: invoiceId,
      organizationId,
      status: { in: ["SENT", "OVERDUE"] },
    },
    data: { status: "PAID", paidAt: new Date() },
  });
  if (result.count === 0) return { message: "Invalid status transition." };
  revalidatePath(`/${orgSlug}/invoices`);
  revalidatePath(`/${orgSlug}/invoices/${invoiceId}`);
  return {};
}

export async function revertToDraft(
  orgSlug: string,
  invoiceId: string
): Promise<{ message?: string }> {
  const { organizationId } = await requireOrg(orgSlug);
  const result = await prisma.invoice.updateMany({
    where: { id: invoiceId, organizationId, status: "SENT" },
    data: { status: "DRAFT", sentAt: null },
  });
  if (result.count === 0) return { message: "Invalid status transition." };
  revalidatePath(`/${orgSlug}/invoices`);
  revalidatePath(`/${orgSlug}/invoices/${invoiceId}`);
  return {};
}
