"use server";

import { db } from "@/app/db";
import {
  invoices,
  invoiceItems,
  quotations,
  quotationItems,
  quotationTemplates,
  clients,
  payments,
  type NewInvoice,
  type NewInvoiceItem,
} from "@/app/db/schema";
import { eq, sql, desc, like, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Helpers ──────────────────────────────────────────────────────────────────


async function generateInvoiceNumber(prefix: string) {
  const rows = await db
    .select({ num: invoices.invoiceNumber })
    .from(invoices)
    .where(like(invoices.invoiceNumber, `${prefix}%`))
    .orderBy(desc(invoices.id))
    .limit(50);

  let nextSeq = 1;
  const escaped = prefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const regex = new RegExp(`${escaped}-?(\\d+)`);

  for (const { num } of rows) {
    const match = num.match(regex);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= nextSeq) nextSeq = n + 1;
    }
  }

  // Check if prefix already ends with a separator
  const separator = prefix.endsWith("/") || prefix.endsWith("-") ? "" : "-";
  return `${prefix}${separator}${String(nextSeq).padStart(2, "0")}`;
}

function todayAndDueDate(daysOut = 30) {
  const today = new Date().toISOString().split("T")[0];
  const due = new Date();
  due.setDate(due.getDate() + daysOut);
  return { today, dueDate: due.toISOString().split("T")[0] };
}

async function insertItems(invoiceId: number, items: Omit<NewInvoiceItem, "invoiceId">[]) {
  if (items.length > 0) {
    await db.insert(invoiceItems).values(items.map((i) => ({ ...i, invoiceId })));
  }
}

function revalidateInvoices(id?: number) {
  revalidatePath("/invoices");
  revalidatePath("/");
  if (id) revalidatePath(`/invoices/${id}`);
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getInvoices() {
  return db
    .select({
      id: invoices.id,
      quotationId: invoices.quotationId,
      quotationNumber: quotations.quotationNumber,
      clientName: clients.name,
      clientBranch: invoices.clientBranch,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
      paidAmount: sql<number>`coalesce((
        select sum(${payments.amount}) from ${payments}
        where ${payments.invoiceId} = ${invoices.id}
      ), 0)`,
    })
    .from(invoices)
    .leftJoin(quotations, eq(invoices.quotationId, quotations.id))
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.createdAt));
}

/** Single optimized fetch: invoice + items + payments + template in parallel */
export async function getInvoice(id: number) {
  // Step 1: Fetch core row
  const [rows] = await Promise.all([
    db
      .select({
        id: invoices.id,
        quotationId: invoices.quotationId,
        templateId: invoices.templateId,
        quotationNumber: quotations.quotationNumber,
        clientId: invoices.clientId,
        clientName: clients.name,
        clientPhone: clients.phone,
        clientEmail: clients.email,
        clientAddress: clients.address,
        invoiceNumber: invoices.invoiceNumber,
        clientBranch: invoices.clientBranch,
        subject: invoices.subject,
        totalAmount: invoices.totalAmount,
        status: invoices.status,
        dueDate: invoices.dueDate,
        invoiceDate: invoices.invoiceDate,
        notes: invoices.notes,
        accountBankName: invoices.accountBankName,
        accountNumber: invoices.accountNumber,
        accountIfsc: invoices.accountIfsc,
        accountHolder: invoices.accountHolder,
        accountPan: invoices.accountPan,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(quotations, eq(invoices.quotationId, quotations.id))
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.id, id)),
  ]);

  const row = rows[0];
  if (!row) return null;

  // Step 2: Fetch items, payments, and template in parallel
  const [items, invoicePayments, template] = await Promise.all([
    db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)),
    db.select().from(payments).where(eq(payments.invoiceId, id)),
    row.templateId
      ? db.select().from(quotationTemplates).where(eq(quotationTemplates.id, row.templateId)).then(r => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  return { ...row, items, payments: invoicePayments, template };
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createInvoice(
  data: Omit<NewInvoice, "invoiceNumber"> & {
    invoiceNumber?: string;
    invoiceDate?: string;
  },
  items: Omit<NewInvoiceItem, "invoiceId">[],
) {
  let dbTemplate = null;
  if (data.templateId) {
    const [row] = await db.select().from(quotationTemplates).where(eq(quotationTemplates.id, data.templateId));
    dbTemplate = row ?? null;
  }
  const { getTemplateConfig } = await import("@/lib/pdf-templates/registry");
  const cfg = getTemplateConfig(dbTemplate?.name, dbTemplate);

  const { today, dueDate } = todayAndDueDate();
  const invoiceNumber = await generateInvoiceNumber(cfg.invoicePrefix);
  const totalAmount = data.totalAmount || items.reduce((s, i) => s + i.amount, 0);

  try {
    const [invoice] = await db
      .insert(invoices)
      .values({
        ...data,
        templateId: data.templateId as number | null,
        invoiceNumber: data.invoiceNumber || invoiceNumber,
        totalAmount,
        invoiceDate: data.invoiceDate || today,
        dueDate,
      })
      .returning();

    await insertItems(invoice.id, items);
    revalidateInvoices();
    return { success: true, invoice };
  } catch (error: any) {
    if (error.code === "23505") {
      return { 
        success: false, 
        error: "This invoice number already exists. Please try a different one or refresh the page." 
      };
    }
    return { 
      success: false, 
      error: error.message || "Failed to create invoice." 
    };
  }
}

export async function generateInvoice(quotationId: number) {
  const [quotation] = await db.select().from(quotations).where(eq(quotations.id, quotationId));
  if (!quotation) throw new Error("Quotation not found");

  const [qtItems, dbTemplate] = await Promise.all([
    db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId)),
    quotation.templateId
      ? db.select().from(quotationTemplates).where(eq(quotationTemplates.id, quotation.templateId)).then(r => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  const { getTemplateConfig } = await import("@/lib/pdf-templates/registry");
  const cfg = getTemplateConfig(dbTemplate?.name, dbTemplate);

  const [invoiceNumber, dates] = await Promise.all([
    generateInvoiceNumber(cfg.invoicePrefix),
    Promise.resolve(todayAndDueDate()),
  ]);

  const [invoice] = await db
    .insert(invoices)
    .values({
      quotationId,
      templateId: quotation.templateId,
      clientId: quotation.clientId,
      invoiceNumber,
      clientBranch: quotation.clientBranch,
      subject: quotation.subject,
      totalAmount: quotation.totalAmount,
      invoiceDate: dates.today,
      dueDate: dates.dueDate,
      notes: quotation.notes,
      accountBankName: cfg.bank.bankName,
      accountNumber: cfg.bank.accountNumber,
      accountIfsc: cfg.bank.ifsc,
      accountHolder: cfg.bank.accountHolder,
      accountPan: cfg.bank.pan,
    })
    .returning();

  await Promise.all([
    insertItems(
      invoice.id,
      qtItems.map(({ description, quantity, rate, taxed, amount }) => ({
        description, quantity, rate, taxed, amount,
      })),
    ),
    db.update(quotations).set({ status: "invoiced" }).where(eq(quotations.id, quotationId)),
  ]);

  revalidateInvoices();
  revalidatePath("/quotations");
  return invoice;
}

export async function updateInvoice(
  id: number,
  data: Partial<NewInvoice>,
  items?: Omit<NewInvoiceItem, "invoiceId">[],
) {
  if (items) {
    const totalAmount = items.reduce((s, i) => s + i.amount, 0);
    await Promise.all([
      db.update(invoices).set({ ...data, totalAmount }).where(eq(invoices.id, id)),
      db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id)),
    ]);
    await insertItems(id, items);
  } else {
    await db.update(invoices).set(data).where(eq(invoices.id, id));
  }
  revalidateInvoices(id);
}

export async function updateInvoiceStatus(id: number, status: string) {
  // Step 1: Update the invoice status
  await db.update(invoices).set({ status }).where(eq(invoices.id, id));

  // Step 2: If cancelled, check if we should reset the quotation status
  if (status === "cancelled") {
    const [row] = await db
      .select({ quotationId: invoices.quotationId })
      .from(invoices)
      .where(eq(invoices.id, id));

    if (row?.quotationId) {
      // Check if any OTHER active invoices exist for this quotation
      const otherInvoices = await db
        .select({ id: invoices.id })
        .from(invoices)
        .where(
          and(
            eq(invoices.quotationId, row.quotationId),
            ne(invoices.id, id),
            ne(invoices.status, "cancelled")
          )
        );

      if (otherInvoices.length === 0) {
        await db
          .update(quotations)
          .set({ status: "accepted" })
          .where(eq(quotations.id, row.quotationId));
      }
    }
  }

  revalidateInvoices();
}

export async function deleteInvoice(id: number) {
  // Step 1: Fetch invoice info before deletion
  const [row] = await db
    .select({ quotationId: invoices.quotationId, status: invoices.status })
    .from(invoices)
    .where(eq(invoices.id, id));

  // Step 2: Delete the invoice
  await db.delete(invoices).where(eq(invoices.id, id));

  // Step 3: Reset quotation status if this was the last active invoice
  if (row?.quotationId && row.status !== "cancelled") {
    const remainingInvoices = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(
        and(
          eq(invoices.quotationId, row.quotationId),
          ne(invoices.status, "cancelled")
        )
      );

    if (remainingInvoices.length === 0) {
      await db
        .update(quotations)
        .set({ status: "accepted" })
        .where(eq(quotations.id, row.quotationId));
    }
  }

  revalidateInvoices();
}

export async function cloneInvoice(id: number) {
  const original = await getInvoice(id);
  if (!original) throw new Error("Invoice not found");

  return createInvoice(
    {
      templateId: original.templateId,
      clientId: original.clientId,
      quotationId: original.quotationId,
      subject: original.subject ? `${original.subject} (Copy)` : null,
      clientBranch: original.clientBranch,
      totalAmount: original.totalAmount,
      status: "unpaid",
      notes: original.notes,
      accountBankName: original.accountBankName,
      accountNumber: original.accountNumber,
      accountIfsc: original.accountIfsc,
      accountHolder: original.accountHolder,
      accountPan: original.accountPan,
    },
    original.items.map(({ description, quantity, rate, taxed, amount }) => ({
      description, quantity, rate, taxed, amount,
    })),
  );
}
