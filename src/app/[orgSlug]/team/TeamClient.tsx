"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { TeamActionState } from "./actions";
import { inviteMember, revokeInvitation, removeMember } from "./actions";

const initial: TeamActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? "Inviting..." : "Send invite"}
    </button>
  );
}

export function InviteMemberForm({ orgSlug }: { orgSlug: string }) {
  const action = inviteMember.bind(null, orgSlug);
  const [state, formAction] = useFormState(action, initial);
  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-medium text-gray-800">Invite a member</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          placeholder="email@example.com"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input type="hidden" name="role" value="MEMBER" />
        <SubmitButton />
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-green-700">{state.message}</p> : null}
      {state.inviteLink ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-sm">
          <p className="text-gray-700">Invite link:</p>
          <p className="break-all font-mono text-xs text-slate-900">{state.inviteLink}</p>
        </div>
      ) : null}
    </form>
  );
}

export function RevokeButton({ orgSlug, invitationId }: { orgSlug: string; invitationId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await revokeInvitation(orgSlug, invitationId);
            if (res.error) setError(res.error);
            else router.refresh();
          });
        }}
        className="text-sm text-red-600 hover:underline disabled:opacity-60"
      >
        {pending ? "Revoking..." : "Revoke"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

export function RemoveMemberButton({ orgSlug, membershipId }: { orgSlug: string; membershipId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Remove this member?")) return;
          setError(null);
          startTransition(async () => {
            const res = await removeMember(orgSlug, membershipId);
            if (res.error) setError(res.error);
            else router.refresh();
          });
        }}
        className="text-sm text-red-600 hover:underline disabled:opacity-60"
      >
        {pending ? "Removing..." : "Remove"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
