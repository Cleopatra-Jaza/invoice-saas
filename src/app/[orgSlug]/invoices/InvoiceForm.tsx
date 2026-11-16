"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { calcTotals, formatMoney } from "@/lib/money";
import type { InvoiceFormState } from "./actions";

type ClientOption = { id: string; name: string };
type ProjectOption = { id: string; name: string };
type Item = { description: string; quantity: number; unitPrice: number };
type Initial = {
  clientId: string;
  projectId: string;
  dueDate: string;
  currency: string;
  taxRate: number;
  notes: string;
  items: Item[];
};

const initialState: InvoiceFormState = {};

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

export default function InvoiceForm({
  orgSlug,
  clients,
  projects,
  action,
  initialValues,
  submitLabel,
}: {
  orgSlug: string;
  clients: ClientOption[];
  projects: ProjectOption[];
  action: (state: InvoiceFormState, formData: FormData) => Promise<InvoiceFormState>;
  initialValues?: Partial<Initial>;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const [clientId, setClientId] = useState(initialValues?.clientId ?? clients[0]?.id ?? "");
  const [projectId, setProjectId] = useState(initialValues?.projectId ?? "");
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? "");
  const [currency, setCurrency] = useState(initialValues?.currency ?? "GBP");
  const [taxRate, setTaxRate] = useState<number>(initialValues?.taxRate ?? 20);
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [items, setItems] = useState<Item[]>(
    initialValues?.items?.length
      ? initialValues.items
      : [{ description: "", quantity: 1, unitPrice: 0 }]
  );

  const totals = useMemo(() => calcTotals(items, Number(taxRate) || 0), [items, taxRate]);

  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-gray-900">
        No clients yet.{" "}
        <Link href={`/${orgSlug}/clients/new`} className="font-medium text-slate-900 underline">
          Create a client first
        </Link>
        .
      </div>
    );
  }

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  }
  function removeItem(index: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  const payload = JSON.stringify({
    clientId,
    projectId,
    dueDate,
    currency,
    taxRate: Number(taxRate),
    notes,
    items,
  });

  return (
    <form action={formAction} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <input type="hidden" name="payload" value={payload} />
      {state.message ? <p className="text-sm text-red-600">{state.message}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-800">Client *</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {state.errors?.clientId ? (
            <p className="mt-1 text-sm text-red-600">{state.errors.clientId[0]}</p>
          ) : null}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800">Project (optional)</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {state.errors?.projectId ? (
            <p className="mt-1 text-sm text-red-600">{state.errors.projectId[0]}</p>
          ) : null}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800">Due date *</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          {state.errors?.dueDate ? (
            <p className="mt-1 text-sm text-red-600">{state.errors.dueDate[0]}</p>
          ) : null}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="GBP">GBP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800">VAT %</label>
          <input
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {state.errors?.taxRate ? (
            <p className="mt-1 text-sm text-red-600">{state.errors.taxRate[0]}</p>
          ) : null}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-800">Line items</h2>
          <button type="button" onClick={addItem} className="text-sm text-slate-900 underline">
            Add row
          </button>
        </div>
        {state.errors?.items ? (
          <p className="mt-1 text-sm text-red-600">{state.errors.items[0]}</p>
        ) : null}
        <div className="mt-2 space-y-3">
          {items.map((item, idx) => {
            const line = Math.round(item.quantity * item.unitPrice * 100) / 100;
            return (
              <div key={idx} className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <label className="block text-xs text-gray-600">Description</label>
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-600">Qty</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-600">Unit price</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-600">Amount</label>
                  <div className="mt-1 rounded-md bg-slate-50 px-2 py-1.5 text-sm text-slate-800">
                    {formatMoney(line, currency)}
                  </div>
                </div>
                <div className="flex items-end sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-sm text-red-600 hover:underline"
                    disabled={items.length === 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-800">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(totals.subtotal, currency)}</span></div>
        <div className="mt-1 flex justify-between"><span>VAT ({Number(taxRate) || 0}%)</span><span>{formatMoney(totals.tax, currency)}</span></div>
        <div className="mt-2 flex justify-between font-semibold text-slate-900"><span>Total</span><span>{formatMoney(totals.total, currency)}</span></div>
      </div>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
