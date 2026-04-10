import { LineItem, Estimate, Invoice } from "@/types/models";

export function calcSubtotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function calcDiscount(
  subtotal: number,
  discount?: number,
  discountType?: "flat" | "percent"
): number {
  if (!discount || discount <= 0) return 0;
  if (discountType === "percent") return (subtotal * discount) / 100;
  return discount;
}

export function calcTotal(lineItems: LineItem[], discount?: number, discountType?: "flat" | "percent"): number {
  const subtotal = calcSubtotal(lineItems);
  const discountAmt = calcDiscount(subtotal, discount, discountType);
  return Math.max(0, subtotal - discountAmt);
}

export function formatCurrency(amount: number, symbol: string = "$"): string {
  return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  // For date-only strings (YYYY-MM-DD), append noon local time to prevent
  // UTC midnight parsing causing an off-by-one-day error on iPhones.
  const normalized = dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
