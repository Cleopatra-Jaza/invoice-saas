"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { clientSchema } from "@/lib/validations/client";

export type ClientFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
    company: formData.get("company") || "",
    address: formData.get("address") || "",
    notes: formData.get("notes") || "",
  });
}

export async function createClient(
  orgSlug: string,
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const { organizationId } = await requireOrg(orgSlug);
  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.client.create({
    data: {
      organizationId,
      ...parsed.data,
    },
  });

  revalidatePath(`/${orgSlug}/clients`);
  redirect(`/${orgSlug}/clients`);
}

export async function updateClient(
  orgSlug: string,
  clientId: string,
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const { organizationId } = await requireOrg(orgSlug);
  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const result = await prisma.client.updateMany({
    where: { id: clientId, organizationId },
    data: { ...parsed.data },
  });

  if (result.count === 0) {
    return { message: "Client not found." };
  }

  revalidatePath(`/${orgSlug}/clients`);
  redirect(`/${orgSlug}/clients`);
}

export async function deleteClient(
  orgSlug: string,
  clientId: string
): Promise<{ message?: string }> {
  const { organizationId } = await requireOrg(orgSlug);
  try {
    const result = await prisma.client.deleteMany({
      where: { id: clientId, organizationId },
    });
    if (result.count === 0) {
      return { message: "Client not found." };
    }
    revalidatePath(`/${orgSlug}/clients`);
    return {};
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return { message: "Client has invoices and cannot be deleted" };
    }
    return { message: "Failed to delete client." };
  }
}
