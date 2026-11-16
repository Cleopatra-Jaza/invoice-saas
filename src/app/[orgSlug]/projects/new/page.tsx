import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import ProjectForm from "../ProjectForm";
import { createProject } from "../actions";

export default async function NewProjectPage({ params }: { params: { orgSlug: string } }) {
  const { organizationId } = await requireOrg(params.orgSlug);
  const clients = await prisma.client.findMany({
    where: { organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const action = createProject.bind(null, params.orgSlug);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">New project</h1>
        <Link href={`/${params.orgSlug}/projects`} className="text-sm text-gray-900 hover:underline">Back to projects</Link>
      </div>
      <ProjectForm action={action} clients={clients} submitLabel="Create project" />
    </div>
  );
}
