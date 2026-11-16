import { requireOrg } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import SignOutButton from "../SignOutButton";

export default async function OrgDashboardPage({
  params,
}: {
  params: { orgSlug: string };
}) {
  const { userId, organization, role } = await requireOrg(params.orgSlug);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome {user?.name ?? "there"}</h1>
        <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
          <div>
            <dt className="font-medium text-slate-500">Organization</dt>
            <dd>{organization.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Role</dt>
            <dd>{role}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Plan</dt>
            <dd>{organization.plan}</dd>
          </div>
        </dl>
        <div className="mt-6 sm:hidden">
          <SignOutButton />
        </div>
      </div>
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Dashboard placeholder.
      </div>
    </div>
  );
}
