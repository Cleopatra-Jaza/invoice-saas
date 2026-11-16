"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ClientFormState } from "./actions";

type ClientValues = {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  notes: string;
};

const initialState: ClientFormState = {};

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

export default function ClientForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (state: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  initialValues?: Partial<ClientValues>;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const values = {
    name: initialValues?.name ?? "",
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    company: initialValues?.company ?? "",
    address: initialValues?.address ?? "",
    notes: initialValues?.notes ?? "",
  };

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      {state.message ? <p className="text-sm text-red-600">{state.message}</p> : null}
      <div>
        <label className="block text-sm font-medium text-gray-800">Name *</label>
        <input
          name="name"
          required
          defaultValue={values.name}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {state.errors?.name ? <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p> : null}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800">Email *</label>
        <input
          name="email"
          type="email"
          required
          defaultValue={values.email}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {state.errors?.email ? <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-800">Phone</label>
          <input name="phone" defaultValue={values.phone} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800">Company</label>
          <input name="company" defaultValue={values.company} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800">Address</label>
        <input name="address" defaultValue={values.address} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800">Notes</label>
        <textarea name="notes" defaultValue={values.notes} rows={4} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <SubmitButton label={submitLabel} />
    </form>
  );
}
