import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import ClientForm from "../../ClientForm";
import { updateClient } from "../../actions";

export default async function EditClientPage({
  params,
}: {
  params: { orgSlug: string; clientId: string };
}) {
  const { organizationId } = await requireOrg(params.orgSlug);
  const client = await prisma.client.findFirst({
    where: { id: params.clientId, organizationId },
  });

  if (!client) {
    notFound();
  }

  const action = updateClient.bind(null, params.orgSlug, params.clientId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Edit client</h1>
        <Link href={`/${params.orgSlug}/clients`} className="text-sm text-slate-700 hover:underline">
          Back to clients
        </Link>
      </div>
      <ClientForm
        action={action}
        submitLabel="Save changes"
        initialValues={{
          name: client.name,
          email: client.email,
          phone: client.phone ?? "",
          company: client.company ?? "",
          address: client.address ?? "",
          notes: client.notes ?? "",
        }}
      />
    </div>
  );
}
