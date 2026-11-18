"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type AcceptInviteState = { error?: string; redirectTo?: string };

export async function acceptInvitation(
  token: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: AcceptInviteState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData
): Promise<AcceptInviteState> {
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return { error: "You must be logged in to accept this invitation." };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { slug: true } } },
  });
  if (
    !invitation ||
    invitation.status !== "PENDING" ||
    invitation.expiresAt < new Date()
  ) {
    return { error: "This invitation is invalid or has expired." };
  }
  if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return { error: "This invite was sent to another email." };
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.membership.findFirst({
      where: { userId: session.user!.id, organizationId: invitation.organizationId },
      select: { id: true },
    });
    if (!existing) {
      await tx.membership.create({
        data: {
          userId: session.user!.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      });
    }
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });
  });

  redirect(`/${invitation.organization.slug}/dashboard`);
}

const signupInviteSchema = z.object({
  name: z.string().min(1).max(100),
  password: z.string().min(8),
});

export async function signupAndAccept(
  token: string,
  _prev: AcceptInviteState,
  formData: FormData
): Promise<AcceptInviteState> {
  const parsed = signupInviteSchema.safeParse({
    name: String(formData.get("name") || "").trim(),
    password: String(formData.get("password") || ""),
  });
  if (!parsed.success) {
    return { error: "Name is required and password must be at least 8 characters." };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { slug: true } } },
  });
  if (
    !invitation ||
    invitation.status !== "PENDING" ||
    invitation.expiresAt < new Date()
  ) {
    return { error: "This invitation is invalid or has expired." };
  }

  const email = invitation.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists. Please log in instead." };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: parsed.data.name, email, passwordHash },
    });
    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });
  });

  return { redirectTo: `/${invitation.organization.slug}/dashboard` };
}
