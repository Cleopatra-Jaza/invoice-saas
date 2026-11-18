import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import DeleteProjectButton from "./DeleteProjectButton";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  ARCHIVED: "bg-slate-100 text-gray-900",
};

export default async function ProjectsPage({ params }: { params: { orgSlug: string } }) {
  const { organizationId, role } = await requireOrg(params.orgSlug);
  const projects = await prisma.project.findMany({
    where: { organizationId },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        <Link
          href={`/${params.orgSlug}/projects/new`}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New project
        </Link>
      </div>
      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-gray-700">
          No projects found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-900">{p.client?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusStyles[p.status] || ""}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/${params.orgSlug}/projects/${p.id}/edit`} className="text-sm text-slate-900 hover:underline">
                        Edit
                      </Link>
                      {role === "OWNER" ? (
                        <DeleteProjectButton orgSlug={params.orgSlug} projectId={p.id} />
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
