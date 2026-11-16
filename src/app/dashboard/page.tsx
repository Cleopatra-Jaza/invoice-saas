import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/session";

export default async function DashboardRedirectPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const organizations = await getUserOrganizations(session.user.id);
  if (organizations.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">No organization found</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your account is not a member of any organization.
          </p>
        </div>
      </main>
    );
  }

  redirect(`/${organizations[0].slug}/dashboard`);
}
