import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { InviteMemberForm, RevokeButton, RemoveMemberButton } from "./TeamClient";

export default async function TeamPage({ params }: { params: { orgSlug: string } }) {
  const { organizationId, role, userId } = await requireOrg(params.orgSlug);

  if (role !== "OWNER") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">Team</h1>
        <p className="mt-2 text-sm text-gray-700">Only the owner can manage the team.</p>
      </div>
    );
  }

  const [members, invitations] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { organizationId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Team</h1>

      <InviteMemberForm orgSlug={params.orgSlug} />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-800">Members</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-gray-700">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-900">{m.user.name}</td>
                  <td className="px-4 py-2 text-gray-900">{m.user.email}</td>
                  <td className="px-4 py-2 text-gray-900">{m.role}</td>
                  <td className="px-4 py-2">
                    {m.userId !== userId ? (
                      <RemoveMemberButton orgSlug={params.orgSlug} membershipId={m.id} />
                    ) : (
                      <span className="text-xs text-gray-500">You</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-800">Pending invitations</h2>
        {invitations.length === 0 ? (
          <p className="mt-2 text-sm text-gray-700">No pending invitations.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Expires</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-900">{inv.email}</td>
                    <td className="px-4 py-2 text-gray-900">{inv.role}</td>
                    <td className="px-4 py-2 text-gray-900">{inv.expiresAt.toISOString().slice(0, 10)}</td>
                    <td className="px-4 py-2">
                      <RevokeButton orgSlug={params.orgSlug} invitationId={inv.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
