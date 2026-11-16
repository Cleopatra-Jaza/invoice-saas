"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarNav({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  const items = [
    { href: `/${orgSlug}/dashboard`, label: "Dashboard" },
    { href: `/${orgSlug}/clients`, label: "Clients" },
    { href: `/${orgSlug}/invoices`, label: "Invoices" },
    { href: `/${orgSlug}/projects`, label: "Projects" },
  ];

  return (
    <nav className="space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-sm">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const isLink = item.label !== "Projects";
        const className = `block rounded-md px-3 py-2 ${
          active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
        }`;
        if (!isLink) {
          return (
            <div key={item.label} className={className}>
              {item.label}
            </div>
          );
        }
        return (
          <Link key={item.href} href={item.href} className={className}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
