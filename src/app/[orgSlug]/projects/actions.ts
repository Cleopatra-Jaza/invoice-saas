"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { requireOwner } from "@/lib/permissions";
import { projectSchema } from "@/lib/validations/project";

export type ProjectFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

function parseProjectForm(formData: FormData) {
  return projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    clientId: formData.get("clientId") || "",
    status: formData.get("status") || "ACTIVE",
  });
}

export async function createProject(
  orgSlug: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const { organizationId } = await requireOrg(orgSlug);
  const parsed = parseProjectForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;
  const clientId = data.clientId || null;
  if (clientId) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, organizationId },
      select: { id: true },
    });
    if (!client) return { message: "Selected client is invalid." };
  }
  await prisma.project.create({
    data: {
      organizationId,
      name: data.name,
      description: data.description || null,
      clientId,
      status: data.status,
    },
  });
  revalidatePath(`/${orgSlug}/projects`);
  redirect(`/${orgSlug}/projects`);
}

export async function updateProject(
  orgSlug: string,
  projectId: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const { organizationId } = await requireOrg(orgSlug);
  const parsed = parseProjectForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;
  const clientId = data.clientId || null;
  if (clientId) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, organizationId },
      select: { id: true },
    });
    if (!client) return { message: "Selected client is invalid." };
  }
  const result = await prisma.project.updateMany({
    where: { id: projectId, organizationId },
    data: {
      name: data.name,
      description: data.description || null,
      clientId,
      status: data.status,
    },
  });
  if (result.count === 0) return { message: "Project not found." };
  revalidatePath(`/${orgSlug}/projects`);
  redirect(`/${orgSlug}/projects`);
}

export async function deleteProject(
  orgSlug: string,
  projectId: string
): Promise<{ message?: string }> {
  const ctx = await requireOwner(orgSlug);
  if (!ctx.isOwner) {
    return { message: "Only the owner can delete projects." };
  }
  const { organizationId } = ctx;
  const result = await prisma.project.deleteMany({
    where: { id: projectId, organizationId },
  });
  if (result.count === 0) return { message: "Project not found." };
  revalidatePath(`/${orgSlug}/projects`);
  return {};
}
