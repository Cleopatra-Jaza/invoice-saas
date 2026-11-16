"use client";

import { useState } from "react";

export default function CopyPublicLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-medium text-gray-800">Public link</h2>
      <p className="mt-1 break-all text-sm text-gray-900">{url}</p>
      <button
        type="button"
        onClick={copy}
        className="mt-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-gray-900 hover:bg-slate-50"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}