import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11);
}

export function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatINR(amount: number): string {
  const formatted = amount.toLocaleString("en-IN");
  if (formatted.includes("₹")) return formatted;
  return `₹${formatted}`;
}

export function generateNumber(prefix: string): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${year}${month}-${random}`;
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function startOfMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

export async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export function formatDateDMY(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  let dateObj: Date;
  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else {
    const parts = dateInput.split("T")[0].split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        dateObj = new Date(y, m, d);
      } else {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        dateObj = new Date(y, m, d);
      }
    } else {
      dateObj = new Date(dateInput);
    }
  }

  if (isNaN(dateObj.getTime())) return "";
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function parseDateDMYToISO(dmyStr: string | null | undefined): string {
  if (!dmyStr) return "";
  const parts = dmyStr.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return dmyStr;
    }
    const d = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }
  return dmyStr;
}

export function getDocumentLabel(mode: string): string {
  switch (mode) {
    case "quotation":
      return "Quotation";
    case "invoice":
      return "Tax Invoice";
    case "sales_order":
      return "Sales Order";
    case "delivery_challan":
      return "Delivery Challan";
    case "eway_bill":
      return "e-Way Bill";
    case "credit_note":
      return "Credit Note";
    default:
      return "Document";
  }
}