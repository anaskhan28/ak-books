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
import { eq, sql, desc, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Shared helpers ───────────────────────────────────────────────────────────

async function resolveTemplateName(templateId: number | null) {
  if (!templateId) return null;
  const [row] = await db
    .select({ name: quotationTemplates.name })
    .from(quotationTemplates)
    .where(eq(quotationTemplates.id, templateId));
  return row?.name ?? null;
}

async function generateInvoiceNumber(prefix: string) {
  const rows = await db
    .select({ num: invoices.invoiceNumber })
    .from(invoices)
    .where(like(invoices.invoiceNumber, `${prefix}-%`))
    .orderBy(desc(invoices.id));

  let nextSeq = 1;
  for (const { num } of rows) {
    const match = num.match(new RegExp(`${prefix}-(\\d+)`));
    if (match) nextSeq = Math.max(nextSeq, parseInt(match[1], 10) + 1);
  }
  return `${prefix}-${String(nextSeq).padStart(2, "0")}`;
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
      clientBranch: invoices.clientBranch, // added
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,   // added
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

export async function getInvoice(id: number) {
  const [row] = await db
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
    .where(eq(invoices.id, id));

  if (!row) return null;

  const [items, invoicePayments] = await Promise.all([
    db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)),
    db.select().from(payments).where(eq(payments.invoiceId, id)),
  ]);

  // Resolve template: invoice's own templateId → quotation's templateId
  let tplId = row.templateId;
  if (!tplId && row.quotationId) {
    const [qt] = await db
      .select({ templateId: quotations.templateId })
      .from(quotations)
      .where(eq(quotations.id, row.quotationId));
    tplId = qt?.templateId ?? null;
  }

  let template = null;
  if (tplId) {
    const [t] = await db.select().from(quotationTemplates).where(eq(quotationTemplates.id, tplId));
    template = t ?? null;
  }

  return { ...row, items, payments: invoicePayments, template };
}

// ── Mutations ────────────────────────────────────────────────────────────────

/** Create a standalone invoice (not linked to a quotation) */
export async function createInvoice(
  data: Omit<NewInvoice, "invoiceNumber"> & { 
    invoiceNumber?: string;
    invoiceDate?: string;
  },
  items: Omit<NewInvoiceItem, "invoiceId">[],
) {
  const tplName = await resolveTemplateName(data.templateId ?? null);
  const { getTemplateConfig } = await import("@/lib/pdf-templates/registry");
  const cfg = getTemplateConfig(tplName);

  const { today, dueDate } = todayAndDueDate();
  const invoiceNumber = await generateInvoiceNumber(cfg.invoicePrefix);
  const totalAmount = data.totalAmount || items.reduce((s, i) => s + i.amount, 0);

  const [invoice] = await db
    .insert(invoices)
    .values({ 
      ...data, 
      templateId: data.templateId as number | null,
      invoiceNumber: data.invoiceNumber || invoiceNumber, 
      totalAmount, 
      invoiceDate: data.invoiceDate || today, 
      dueDate 
    })
    .returning();

  await insertItems(invoice.id, items);
  revalidateInvoices();
  return invoice;
}

/** Generate an invoice from an existing quotation */
export async function generateInvoice(quotationId: number) {
  const [quotation] = await db.select().from(quotations).where(eq(quotations.id, quotationId));
  if (!quotation) throw new Error("Quotation not found");

  const qtItems = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));

  const tplName = await resolveTemplateName(quotation.templateId);
  const { getTemplateConfig } = await import("@/lib/pdf-templates/registry");
  const cfg = getTemplateConfig(tplName);

  const invoiceNumber = await generateInvoiceNumber(cfg.invoicePrefix);
  const { today, dueDate } = todayAndDueDate();

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
      invoiceDate: today,
      dueDate,
      notes: quotation.notes,
      accountBankName: cfg.bank.bankName,
      accountNumber: cfg.bank.accountNumber,
      accountIfsc: cfg.bank.ifsc,
      accountHolder: cfg.bank.accountHolder,
      accountPan: cfg.bank.pan,
    })
    .returning();

  await insertItems(
    invoice.id,
    qtItems.map(({ description, quantity, rate, taxed, amount }) => ({
      description, quantity, rate, taxed, amount,
    })),
  );

  await db.update(quotations).set({ status: "invoiced" }).where(eq(quotations.id, quotationId));
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
    await db.update(invoices).set({ ...data, totalAmount }).where(eq(invoices.id, id));
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    await insertItems(id, items);
  } else {
    await db.update(invoices).set(data).where(eq(invoices.id, id));
  }
  revalidateInvoices(id);
}

export async function updateInvoiceStatus(id: number, status: string) {
  await db.update(invoices).set({ status }).where(eq(invoices.id, id));
  revalidateInvoices();
}

export async function deleteInvoice(id: number) {
  await db.delete(invoices).where(eq(invoices.id, id));
  revalidateInvoices();
}

export async function cloneInvoice(id: number) {
  const original = await getInvoice(id);
  if (!original) throw new Error("Invoice not found");

  const { 
    templateId, 
    clientId, 
    quotationId,
    subject, 
    clientBranch, 
    totalAmount, 
    notes,
    accountBankName,
    accountNumber,
    accountIfsc,
    accountHolder,
    accountPan
  } = original;

  const clonedItems = original.items.map((i) => ({
    description: i.description,
    quantity: i.quantity,
    rate: i.rate,
    taxed: i.taxed,
    amount: i.amount,
  }));

  const cloned = await createInvoice(
    {
      templateId,
      clientId,
      quotationId,
      subject: subject ? `${subject} (Copy)` : null,
      clientBranch,
      totalAmount,
      status: "unpaid",
      notes,
      accountBankName,
      accountNumber,
      accountIfsc,
      accountHolder,
      accountPan
    },
    clonedItems
  );

  return cloned;
}
