"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatMoney } from "@/lib/money";

export default function RevenueChart({
  data,
  currency,
}: {
  data: { label: string; revenue: number }[];
  currency: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fill: "#374151", fontSize: 12 }} />
          <YAxis tick={{ fill: "#374151", fontSize: 12 }} width={60} />
          <Tooltip
            formatter={(value) => [formatMoney(Number(value ?? 0), currency), "Revenue"]}
            contentStyle={{ color: "#111827", fontSize: 12 }}
            labelStyle={{ color: "#111827" }}
          />
          <Bar dataKey="revenue" fill="#334155" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
