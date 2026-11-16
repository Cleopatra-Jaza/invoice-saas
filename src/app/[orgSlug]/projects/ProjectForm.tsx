"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ProjectFormState } from "./actions";

type ClientOption = { id: string; name: string };
type Values = { name: string; description: string; clientId: string; status: string };

const initialState: ProjectFormState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export default function ProjectForm({
  action,
  clients,
  initialValues,
  submitLabel,
}: {
  action: (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  clients: ClientOption[];
  initialValues?: Partial<Values>;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const v = {
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    clientId: initialValues?.clientId ?? "",
    status: initialValues?.status ?? "ACTIVE",
  };

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      {state.message ? <p className="text-sm text-red-600">{state.message}</p> : null}
      <div>
        <label className="block text-sm font-medium text-gray-800">Name *</label>
        <input
          name="name"
          required
          defaultValue={v.name}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {state.errors?.name ? <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p> : null}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800">Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={v.description}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-800">Client (optional)</label>
          <select name="clientId" defaultValue={v.clientId} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800">Status</label>
          <select name="status" defaultValue={v.status} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>
      <SubmitButton label={submitLabel} />
    </form>
  );
}
