import Link from "next/link";
import ClientForm from "../ClientForm";
import { createClient } from "../actions";

export default function NewClientPage({ params }: { params: { orgSlug: string } }) {
  const action = createClient.bind(null, params.orgSlug);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">New client</h1>
        <Link href={`/${params.orgSlug}/clients`} className="text-sm text-slate-700 hover:underline">
          Back to clients
        </Link>
      </div>
      <ClientForm action={action} submitLabel="Create client" />
    </div>
  );
}
