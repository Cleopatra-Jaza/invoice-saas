import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be 0 or more"),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().optional().or(z.literal("")),
  dueDate: z.string().min(1, "Due date is required"),
  currency: z.enum(["GBP", "USD", "EUR"]).default("GBP"),
  taxRate: z.coerce.number().min(0).max(100).default(20),
  notes: z.string().trim().optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "At least one line item is required"),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
