"use client";

import { useRouter } from "next/navigation";

type Org = { slug: string; name: string };

export default function OrgSwitcher({
  currentSlug,
  organizations,
}: {
  currentSlug: string;
  organizations: Org[];
}) {
  const router = useRouter();

  return (
    <select
      value={currentSlug}
      onChange={(e) => router.push(`/${e.target.value}/dashboard`)}
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-gray-900"
      aria-label="Switch organization"
    >
      {organizations.map((org) => (
        <option key={org.slug} value={org.slug}>
          {org.name}
        </option>
      ))}
    </select>
  );
}
