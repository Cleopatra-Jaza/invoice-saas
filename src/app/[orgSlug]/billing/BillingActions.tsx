"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { BillingActionState } from "./actions";

const initialState: BillingActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? "Redirecting..." : label}
    </button>
  );
}

export default function BillingActions({
  action,
  label,
}: {
  action: (state: BillingActionState, formData: FormData) => Promise<BillingActionState>;
  label: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  return (
    <form action={formAction} className="space-y-2">
      <SubmitButton label={label} />
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
    </form>
  );
}
