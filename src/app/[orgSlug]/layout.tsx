import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserOrganizations, requireOrg } from "@/lib/session";
import OrgSwitcher from "./OrgSwitcher";
import SignOutButton from "./SignOutButton";
import SidebarNav from "./SidebarNav";

export default async function OrgLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { orgSlug: string };
}) {
  const { organization, role } = await requireOrg(params.orgSlug);
  const session = await getServerSession(authOptions);
  const organizations = session?.user?.id ? await getUserOrganizations(session.user.id) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">{organization.name}</span>
            <OrgSwitcher
              currentSlug={params.orgSlug}
              organizations={organizations.map((o) => ({ slug: o.slug, name: o.name }))}
            />
          </div>
          <SignOutButton />
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden w-48 shrink-0 md:block">
          <SidebarNav orgSlug={params.orgSlug} role={role} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
