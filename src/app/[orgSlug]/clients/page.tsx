import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import DeleteClientButton from "./DeleteClientButton";

export default async function ClientsPage({
  params,
  searchParams,
}: {
  params: { orgSlug: string };
  searchParams: { q?: string };
}) {
  const { organizationId, role } = await requireOrg(params.orgSlug);
  const q = (searchParams.q || "").trim();

  const clients = await prisma.client.findMany({
    where: {
      organizationId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
        <Link
          href={`/${params.orgSlug}/clients/new`}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New client
        </Link>
      </div>
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email"
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
          Search
        </button>
      </form>
      {clients.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-gray-700">
          No clients found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900">{client.name}</td>
                  <td className="px-4 py-3 text-gray-900">{client.email}</td>
                  <td className="px-4 py-3 text-gray-900">{client.company || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/${params.orgSlug}/clients/${client.id}/edit`}
                        className="text-sm text-slate-900 hover:underline"
                      >
                        Edit
                      </Link>
                      {role === "OWNER" ? (
                        <DeleteClientButton orgSlug={params.orgSlug} clientId={client.id} />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
