"use server";

import { db } from "@/app/db";
import {
  payments,
  invoices,
  clients,
  type NewPayment,
} from "@/app/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Helpers ──────────────────────────────────────────────────────────────────

function revalidateAll() {
  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath("/");
}

/**
 * Sync invoice status based on total settled (amount received + TDS).
 * totalSettled = sum(amount) + sum(tds_amount)
 * If totalSettled >= invoiceTotal → "paid"
 * If totalSettled > 0 but < invoiceTotal → "partial"
 * If no payments → "unpaid"
 */
async function syncInvoiceStatus(invoiceId: number) {
  const [invoice] = await db
    .select({ totalAmount: invoices.totalAmount })
    .from(invoices)
    .where(eq(invoices.id, invoiceId));

  const [{ totalReceived, totalTds }] = await db
    .select({
      totalReceived: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      totalTds: sql<number>`coalesce(sum(${payments.TDSAmount}), 0)`,
    })
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId));

  const totalSettled = Number(totalReceived) + Number(totalTds);
  const newStatus =
    totalSettled >= invoice.totalAmount ? "paid" : totalSettled > 0 ? "partial" : "unpaid";

  await db
    .update(invoices)
    .set({ status: newStatus })
    .where(eq(invoices.id, invoiceId));
}

// ── Queries ──────────────────────────────────────────────────────────────────

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
    .orderBy(payments.paymentDate);
}

export async function getPaymentsForInvoice(invoiceId: number) {
  return db
    .select({
      id: payments.id,
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
    .where(eq(payments.invoiceId, invoiceId))
    .orderBy(payments.paymentDate);
}


// ── Mutations ────────────────────────────────────────────────────────────────

export async function recordPayment(data: NewPayment) {
  const [payment] = await db.insert(payments).values(data).returning();
  await syncInvoiceStatus(data.invoiceId);
  revalidateAll();
  return payment;
}

export async function deletePayment(id: number) {
  // Get invoice id before deleting
  const [row] = await db
    .select({ invoiceId: payments.invoiceId })
    .from(payments)
    .where(eq(payments.id, id));

  await db.delete(payments).where(eq(payments.id, id));

  // Re-sync the invoice status after deletion
  if (row) await syncInvoiceStatus(row.invoiceId);

  revalidateAll();
}

export async function getPendingPayments() {
  const rows = await db
    .select({
      totalInvoiced: sql<number>`coalesce(sum(${invoices.totalAmount}), 0)`,
      totalPaid: sql<number>`coalesce((
        select sum(${payments.amount}) from ${payments}
      ), 0)`,
    })
    .from(invoices)
    .where(eq(invoices.status, "unpaid"));

  const unpaidTotal = Number(rows[0]?.totalInvoiced ?? 0);

  const partialRows = await db
    .select({
      totalInvoiced: sql<number>`coalesce(sum(${invoices.totalAmount}), 0)`,
    })
    .from(invoices)
    .where(eq(invoices.status, "partial"));

  const partialPaid = await db
    .select({
      totalPaid: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .where(eq(invoices.status, "partial"));

  const partialPending =
    Number(partialRows[0]?.totalInvoiced ?? 0) -
    Number(partialPaid[0]?.totalPaid ?? 0);

  return unpaidTotal + partialPending;
}
