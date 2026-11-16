export function formatMoney(amount: number | string, currency: string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calcTotals(
  items: { quantity: number; unitPrice: number }[],
  taxRate: number
): {
  items: { quantity: number; unitPrice: number; amount: number }[];
  subtotal: number;
  tax: number;
  total: number;
} {
  const withAmounts = items.map((item) => ({
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: round2(item.quantity * item.unitPrice),
  }));
  const subtotal = round2(withAmounts.reduce((sum, i) => sum + i.amount, 0));
  const tax = round2(subtotal * (taxRate / 100));
  const total = round2(subtotal + tax);
  return { items: withAmounts, subtotal, tax, total };
}
