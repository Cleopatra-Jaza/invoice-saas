"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-gray-900 hover:bg-slate-50"
    >
      Sign out
    </button>
  );
}
