import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl text-center">
          <p className="text-sm font-medium text-gray-700">B2B invoicing for modern teams</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Run billing, projects, and teams in one workspace
          </h1>
          <p className="mt-4 text-base text-gray-700 sm:text-lg">
            InvoiceFlow helps you manage clients, send professional invoices, and track revenue
            across organizations with clear role-based access.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md bg-slate-900 px-6 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-6 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Sign up
            </Link>
          </div>
        </div>

        <div className="mt-12 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-left">
            <h2 className="text-base font-semibold text-slate-900">Multi-tenant workspaces</h2>
            <p className="mt-2 text-sm text-gray-700">
              Keep each organization’s clients, projects, and invoices isolated with team roles.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-left">
            <h2 className="text-base font-semibold text-slate-900">Stripe billing</h2>
            <p className="mt-2 text-sm text-gray-700">
              Manage subscriptions and let clients pay invoices securely through Stripe Checkout.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-left">
            <h2 className="text-base font-semibold text-slate-900">PDF invoices and email</h2>
            <p className="mt-2 text-sm text-gray-700">
              Generate polished PDF invoices and share or email them with public payment links.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
