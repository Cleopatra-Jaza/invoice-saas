import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          InvoiceFlow
        </h1>
        <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
          Simple invoicing and project management for modern B2B teams.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
    </main>
  );
}
