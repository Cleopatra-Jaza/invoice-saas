"use client";

import { useState, useTransition } from "react";
import { emailInvoice } from "../actions";

export default function EmailInvoiceButton({
  orgSlug,
  invoiceId,
  clientEmail,
}: {
  orgSlug: string;
  invoiceId: string;
  clientEmail: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-900">Send to {clientEmail}</p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              const res = await emailInvoice(orgSlug, invoiceId);
              if (res?.error) {
                setMessage({ type: "error", text: res.error });
                return;
              }
              setMessage({ type: "success", text: "Invoice emailed successfully." });
            });
          }}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Sending..." : "Email to client"}
        </button>
      </div>
      {message ? (
        <p
          className={`mt-2 text-sm ${
            message.type === "error" ? "text-red-600" : "text-green-700"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
