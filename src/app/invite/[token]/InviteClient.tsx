"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { signIn } from "next-auth/react";
import type { AcceptInviteState } from "./actions";
import { acceptInvitation, signupAndAccept } from "./actions";

const initial: AcceptInviteState = {};

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function AcceptInviteButton({ token }: { token: string }) {
  const action = acceptInvitation.bind(null, token);
  const [state, formAction] = useFormState(action, initial);
  return (
    <form action={formAction} className="space-y-3">
      <Submit label="Join organization" pendingLabel="Joining..." />
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
    </form>
  );
}

export function SignupInviteForm({ token, email }: { token: string; email: string }) {
  const action = signupAndAccept.bind(null, token);
  const [state, formAction] = useFormState(action, initial);

  useEffect(() => {
    if (!state.redirectTo) return;
    const form = document.getElementById("invite-signup-form") as HTMLFormElement | null;
    const pw = (form?.elements.namedItem("password") as HTMLInputElement | null)?.value;
    (async () => {
      await signIn("credentials", {
        email,
        password: pw || "",
        redirect: false,
      });
      window.location.href = state.redirectTo!;
    })();
  }, [state.redirectTo, email]);

  return (
    <form id="invite-signup-form" action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-800">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-gray-700"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800">Name</label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <Submit label="Create account & join" pendingLabel="Creating account..." />
    </form>
  );
}
