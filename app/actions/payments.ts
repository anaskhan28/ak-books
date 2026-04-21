"use server";

import { db } from "@/app/db";
import {
  payments,
  invoices,
  clients,
  type NewPayment,
} from "@/app/db/schema";
import { eq, sql, desc, and, or, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Standard revalidation following consistent pattern across modules
 */
function revalidatePayments(invoiceId?: number) {
  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath("/");
  if (invoiceId) revalidatePath(`/invoices/${invoiceId}`);
}

/**
 * Sync invoice status based on total settled (amount received + TDS).
 * totalSettled = sum(amount) + sum(tds_amount)
 * If totalSettled >= invoiceTotal → "paid"
 * If totalSettled > 0 but < invoiceTotal → "partial"
 * If no payments → "unpaid"
 */
async function syncInvoiceStatus(invoiceId: number) {
  // Optimized: Parallel fetch of invoice total and current payment stats
  const [[invoice], [paymentStats]] = await Promise.all([
    db
      .select({ totalAmount: invoices.totalAmount })
      .from(invoices)
      .where(eq(invoices.id, invoiceId)),
    db
      .select({
        totalReceived: sql<number>`coalesce(sum(${payments.amount}), 0)`,
        totalTds: sql<number>`coalesce(sum(${payments.TDSAmount}), 0)`,
      })
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId)),
  ]);

  if (!invoice) return;

  const totalSettled = Number(paymentStats.totalReceived) + Number(paymentStats.totalTds);
  const newStatus =
    totalSettled >= invoice.totalAmount ? "paid" : totalSettled > 0 ? "partial" : "unpaid";

  await db
    .update(invoices)
    .set({ status: newStatus })
    .where(eq(invoices.id, invoiceId));
}

// ── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches all payments with joined invoice and client info
 */
export async function getPayments() {
  return db
    .select({
      id: payments.id,
      invoiceId: payments.invoiceId,
      invoiceNumber: invoices.invoiceNumber,
      clientName: clients.name,
      amount: payments.amount,
      TDSAmount: payments.TDSAmount,
      paymentDate: payments.paymentDate,
      paymentMethod: payments.paymentMethod,
      referenceNumber: payments.referenceNumber,
      depositTo: payments.depositTo,
      paymentReceivedOn: payments.paymentReceivedOn,
      notes: payments.notes,
    })
    .from(payments)
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(payments.paymentDate));
}

/**
 * Fetches all payments recorded against a specific invoice
 */
export async function getPaymentsForInvoice(invoiceId: number) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId))
    .orderBy(desc(payments.paymentDate));
}

// ── Mutations ────────────────────────────────────────────────────────────────

/**
 * Records a new payment and updates invoice status
 */
export async function recordPayment(data: NewPayment) {
  const [payment] = await db.insert(payments).values(data).returning();
  await syncInvoiceStatus(data.invoiceId);
  revalidatePayments(data.invoiceId);
  return payment;
}

/**
 * Deletes a payment record and re-syncs invoice status
 */
export async function deletePayment(id: number) {
  // 1. Get invoice id to re-sync later
  const [paymentRow] = await db
    .select({ invoiceId: payments.invoiceId })
    .from(payments)
    .where(eq(payments.id, id));

  if (!paymentRow) return;

  // 2. Delete the payment
  await db.delete(payments).where(eq(payments.id, id));

  // 3. Re-sync invoice status
  await syncInvoiceStatus(paymentRow.invoiceId);

  revalidatePayments(paymentRow.invoiceId);
}

/**
 * Optimised pending balance calculator.
 * pending = sum(unpaid invoices total) + sum(partial invoices total - partial invoices paid)
 */
export async function getPendingPayments() {
  const [{ pending }] = await db
    .select({
      pending: sql<number>`coalesce(
        (
          SELECT sum(${invoices.totalAmount})
          FROM ${invoices}
          WHERE ${invoices.status} IN ('unpaid', 'partial')
        ) - (
          SELECT sum(${payments.amount})
          FROM ${payments}
          JOIN ${invoices} ON ${payments.invoiceId} = ${invoices.id}
          WHERE ${invoices.status} = 'partial'
        ), 0
      )`,
    })
    .from(invoices)
    .limit(1);

  return Number(pending);
}
