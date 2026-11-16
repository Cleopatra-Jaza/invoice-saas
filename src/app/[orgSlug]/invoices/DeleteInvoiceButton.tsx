"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInvoice } from "./actions";

export default function DeleteInvoiceButton({
  orgSlug,
  invoiceId,
}: {
  orgSlug: string;
  invoiceId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this draft invoice?")) return;
          setMessage(null);
          startTransition(async () => {
            const res = await deleteInvoice(orgSlug, invoiceId);
            if (res?.message) {
              setMessage(res.message);
              return;
            }
            router.push(`/${orgSlug}/invoices`);
            router.refresh();
          });
        }}
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
      {message ? <span className="text-xs text-red-600">{message}</span> : null}
    </div>
  );
}