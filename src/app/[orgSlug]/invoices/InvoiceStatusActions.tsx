"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markInvoicePaid, markInvoiceSent, revertToDraft } from "./actions";

export default function InvoiceStatusActions({
  orgSlug,
  invoiceId,
  status,
}: {
  orgSlug: string;
  invoiceId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(action: (slug: string, id: string) => Promise<{ message?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const res = await action(orgSlug, invoiceId);
      if (res?.message) {
        setMessage(res.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(markInvoiceSent)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Mark as sent
          </button>
        ) : null}
        {status === "SENT" || status === "OVERDUE" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(markInvoicePaid)}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-60"
          >
            Mark as paid
          </button>
        ) : null}
        {status === "SENT" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(revertToDraft)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-gray-900 hover:bg-slate-50 disabled:opacity-60"
          >
            Revert to draft
          </button>
        ) : null}
      </div>
      {message ? <span className="text-xs text-red-600">{message}</span> : null}
    </div>
  );
}
