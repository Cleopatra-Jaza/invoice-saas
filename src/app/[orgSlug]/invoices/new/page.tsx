import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import InvoiceForm from "../InvoiceForm";
import { createInvoice } from "../actions";

export default async function NewInvoicePage({ params }: { params: { orgSlug: string } }) {
  const { organizationId } = await requireOrg(params.orgSlug);
  const [clients, projects] = await Promise.all([
    prisma.client.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const action = createInvoice.bind(null, params.orgSlug);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">New invoice</h1>
        <Link href={`/${params.orgSlug}/invoices`} className="text-sm text-gray-900 hover:underline">
          Back to invoices
        </Link>
      </div>
      <InvoiceForm
        orgSlug={params.orgSlug}
        clients={clients}
        projects={projects}
        action={action}
        submitLabel="Create invoice"
      />
    </div>
  );
}