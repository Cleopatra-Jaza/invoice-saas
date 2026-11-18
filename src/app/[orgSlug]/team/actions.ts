"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/permissions";
import { sendInviteEmail } from "@/lib/email";

export type TeamActionState = {
  message?: string;
  error?: string;
  inviteLink?: string;
};

const inviteSchema = z.object({
  email: z.string().email(),
});

export async function inviteMember(
  orgSlug: string,
  _prev: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const ctx = await requireOwner(orgSlug);
  if (!ctx.isOwner) {
    return { error: "Only the owner can manage the team." };
  }

  const parsed = inviteSchema.safeParse({
    email: String(formData.get("email") || "").trim().toLowerCase(),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }
  const email = parsed.data.email;

  const existingMember = await prisma.membership.findFirst({
    where: { organizationId: ctx.organizationId, user: { email } },
    select: { id: true },
  });
  if (existingMember) {
    return { error: "This email is already a member of the organization." };
  }

  const pending = await prisma.invitation.findFirst({
    where: { organizationId: ctx.organizationId, email, status: "PENDING" },
    select: { id: true },
  });
  if (pending) {
    return { error: "A pending invitation for this email already exists." };
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invitation = await prisma.invitation.create({
    data: {
      organizationId: ctx.organizationId,
      email,
      role: "MEMBER",
      expiresAt,
      invitedById: ctx.userId,
    },
    select: { token: true },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${base}/invite/${invitation.token}`;

  try {
    await sendInviteEmail({
      to: email,
      organizationName: ctx.organization.name,
      inviteUrl,
    });
    revalidatePath(`/${orgSlug}/team`);
    return { message: `Invitation sent to ${email}.` };
  } catch {
    revalidatePath(`/${orgSlug}/team`);
    return {
      message: "Invitation created, but email could not be sent. Share this link:",
      inviteLink: inviteUrl,
    };
  }
}

export async function revokeInvitation(
  orgSlug: string,
  invitationId: string
): Promise<{ message?: string; error?: string }> {
  const ctx = await requireOwner(orgSlug);
  if (!ctx.isOwner) return { error: "Only the owner can manage the team." };
  const result = await prisma.invitation.updateMany({
    where: { id: invitationId, organizationId: ctx.organizationId, status: "PENDING" },
    data: { status: "REVOKED" },
  });
  if (result.count === 0) return { error: "Invitation not found." };
  revalidatePath(`/${orgSlug}/team`);
  return { message: "Invitation revoked." };
}

export async function removeMember(
  orgSlug: string,
  membershipId: string
): Promise<{ message?: string; error?: string }> {
  const ctx = await requireOwner(orgSlug);
  if (!ctx.isOwner) return { error: "Only the owner can manage the team." };

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.organizationId },
    select: { id: true, role: true, userId: true },
  });
  if (!membership) return { error: "Member not found." };
  if (membership.userId === ctx.userId) {
    return { error: "You cannot remove yourself." };
  }
  if (membership.role === "OWNER") {
    const ownerCount = await prisma.membership.count({
      where: { organizationId: ctx.organizationId, role: "OWNER" },
    });
    if (ownerCount <= 1) return { error: "Cannot remove the last owner." };
  }

  await prisma.membership.delete({ where: { id: membership.id } });
  revalidatePath(`/${orgSlug}/team`);
  return { message: "Member removed." };
}
