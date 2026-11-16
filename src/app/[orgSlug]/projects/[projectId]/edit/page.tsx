import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import ProjectForm from "../../ProjectForm";
import { updateProject } from "../../actions";

export default async function EditProjectPage({
  params,
}: {
  params: { orgSlug: string; projectId: string };
}) {
  const { organizationId } = await requireOrg(params.orgSlug);
  const [project, clients] = await Promise.all([
    prisma.project.findFirst({ where: { id: params.projectId, organizationId } }),
    prisma.client.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!project) notFound();
  const action = updateProject.bind(null, params.orgSlug, params.projectId);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Edit project</h1>
        <Link href={`/${params.orgSlug}/projects`} className="text-sm text-gray-900 hover:underline">Back to projects</Link>
      </div>
      <ProjectForm
        action={action}
        clients={clients}
        submitLabel="Save changes"
        initialValues={{
          name: project.name,
          description: project.description ?? "",
          clientId: project.clientId ?? "",
          status: project.status,
        }}
      />
    </div>
  );
}
