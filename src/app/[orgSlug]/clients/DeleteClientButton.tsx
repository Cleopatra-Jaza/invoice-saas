"use client";

import { useState, useTransition } from "react";
import { deleteClient } from "./actions";

export default function DeleteClientButton({
  orgSlug,
  clientId,
}: {
  orgSlug: string;
  clientId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this client?")) return;
          setMessage(null);
          startTransition(async () => {
            const res = await deleteClient(orgSlug, clientId);
            if (res?.message) setMessage(res.message);
          });
        }}
        className="text-sm text-red-600 hover:underline disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
      {message ? <span className="text-xs text-red-600">{message}</span> : null}
    </div>
  );
}
