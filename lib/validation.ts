// ── GSTIN regex (15-char Indian GST format) ─────────────────────────────────
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function validateGSTIN(gstin: string): { valid: boolean; error?: string } {
  if (!gstin) return { valid: true }; // GST is optional
  const cleaned = gstin.trim().toUpperCase();
  if (cleaned.length !== 15) return { valid: false, error: "GSTIN must be exactly 15 characters" };
  if (!GSTIN_REGEX.test(cleaned)) return { valid: false, error: "Invalid GSTIN format" };
  return { valid: true };
}
