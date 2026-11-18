import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AcceptInviteButton, SignupInviteForm } from "./InviteClient";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const invitation = await prisma.invitation.findUnique({
    where: { token: params.token },
    include: { organization: { select: { name: true, slug: true } } },
  });

  const invalid =
    !invitation ||
    invitation.status !== "PENDING" ||
    invitation.expiresAt < new Date();

  if (invalid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Invalid invitation</h1>
          <p className="mt-2 text-sm text-gray-700">
            This invitation link is invalid, expired, or has already been used.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm font-medium text-slate-900 underline">
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  const session = await getServerSession(authOptions);
  const callback = `/invite/${params.token}`;

  if (!session?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Join {invitation.organization.name}
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              You have been invited as <strong>{invitation.role}</strong> to join{" "}
              <strong>{invitation.organization.name}</strong>.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 p-4">
            <h2 className="text-sm font-medium text-gray-800">Create account</h2>
            <p className="mt-1 text-sm text-gray-700">
              Create an account with the invited email to join.
            </p>
            <div className="mt-3">
              <SignupInviteForm token={params.token} email={invitation.email} />
            </div>
          </div>
          <div className="rounded-md border border-slate-200 p-4">
            <h2 className="text-sm font-medium text-gray-800">I already have an account</h2>
            <p className="mt-1 text-sm text-gray-700">
              Log in with <strong>{invitation.email}</strong> to accept this invitation.
            </p>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callback)}`}
              className="mt-3 inline-block rounded-md border border-slate-300 px-4 py-2 text-sm text-gray-900 hover:bg-slate-50"
            >
              Log in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const sessionEmail = session.user.email?.toLowerCase() || "";
  if (sessionEmail !== invitation.email.toLowerCase()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Email mismatch</h1>
          <p className="mt-2 text-sm text-gray-700">
            This invite was sent to another email.
          </p>
          <p className="mt-2 text-sm text-gray-700">
            Please log in with the invited email address to accept it.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Join {invitation.organization.name}</h1>
        <p className="mt-2 text-sm text-gray-700">
          You are logged in as <strong>{session.user.email}</strong>. Accept this invitation to join as{" "}
          <strong>{invitation.role}</strong>.
        </p>
        <div className="mt-4">
          <AcceptInviteButton token={params.token} />
        </div>
      </div>
    </main>
  );
}
