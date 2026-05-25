"use server";

import { db } from "@/app/db";
import {
  creditNotes,
  creditNoteItems,
  quotationTemplates,
  clients,
  clientBranches,
  type NewCreditNote,
  type NewCreditNoteItem,
} from "@/app/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { getNextDocumentNumber } from "./quotations";

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getCreditNotes(options?: {
  templateId?: number;
  status?: string;
  page?: number;
  limit?: number;
  statuses?: string[];
  all?: boolean;
}) {
  const templateId = options?.templateId;
  const status = options?.status;
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 25;
  const offset = (page - 1) * limit;
  const statuses = options?.statuses;
  const all = options?.all ?? false;

  const conditions = [];
  if (templateId) {
    conditions.push(eq(creditNotes.templateId, templateId));
  }
  if (status && status !== "all") {
    conditions.push(eq(creditNotes.status, status.toLowerCase()));
  }
  if (statuses && statuses.length > 0) {
    conditions.push(inArray(creditNotes.status, statuses.map(s => s.toLowerCase())));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const query = db
    .select({
      id: creditNotes.id,
      invoiceId: creditNotes.invoiceId,
      templateId: creditNotes.templateId,
      templateName: quotationTemplates.name,
      clientId: creditNotes.clientId,
      clientName: clients.name,
      creditNoteNumber: creditNotes.creditNoteNumber,
      creditNoteDate: creditNotes.creditNoteDate,
      subject: creditNotes.subject,
      clientBranch: creditNotes.clientBranch,
      totalAmount: creditNotes.totalAmount,
      status: creditNotes.status,
      reason: creditNotes.reason,
      notes: creditNotes.notes,
      placeOfSupply: creditNotes.placeOfSupply,
      showTotal: creditNotes.showTotal,
      createdAt: creditNotes.createdAt,
    })
    .from(creditNotes)
    .leftJoin(clients, eq(creditNotes.clientId, clients.id))
    .leftJoin(quotationTemplates, eq(creditNotes.templateId, quotationTemplates.id));

  if (whereClause) {
    query.where(whereClause);
  }

  query.orderBy(desc(creditNotes.createdAt));

  if (all) {
    const data = await query;
    return { data, totalCount: data.length };
  }

  const countQuery = db.select({ count: sql<number>`count(*)` }).from(creditNotes);
  if (whereClause) countQuery.where(whereClause);

  const [data, [{ count: totalCount }]] = await Promise.all([
    query.limit(limit).offset(offset),
    countQuery,
  ]);

  return { data, totalCount: Number(totalCount) };
}

export async function getCreditNote(id: number) {
  const [rows, items, allTemplates] = await Promise.all([
    db
      .select({
        id: creditNotes.id,
        invoiceId: creditNotes.invoiceId,
        templateId: creditNotes.templateId,
        clientId: creditNotes.clientId,
        clientName: clients.name,
        clientPhone: clients.phone,
        clientEmail: clients.email,
        clientAddress: clients.address,
        clientGstin: clients.gstin,
        creditNoteNumber: creditNotes.creditNoteNumber,
        creditNoteDate: creditNotes.creditNoteDate,
        subject: creditNotes.subject,
        clientBranch: creditNotes.clientBranch,
        totalAmount: creditNotes.totalAmount,
        status: creditNotes.status,
        reason: creditNotes.reason,
        notes: creditNotes.notes,
        placeOfSupply: creditNotes.placeOfSupply,
        showTotal: creditNotes.showTotal,
        createdAt: creditNotes.createdAt,
      })
      .from(creditNotes)
      .leftJoin(clients, eq(creditNotes.clientId, clients.id))
      .where(eq(creditNotes.id, id)),
    db.select().from(creditNoteItems).where(eq(creditNoteItems.creditNoteId, id)),
    db.select().from(quotationTemplates),
  ]);

  const row = rows[0];
  if (!row) return null;

  const template = row.templateId
    ? allTemplates.find((t) => t.id === row.templateId) ?? null
    : null;

  let resolvedGstin = row.clientGstin || null;
  if (row.clientBranch && row.clientId) {
    const branchName = row.clientBranch.split("\n")[0].trim();
    const branchRows = await db
      .select({ gstin: clientBranches.gstin })
      .from(clientBranches)
      .where(
        and(
          eq(clientBranches.clientId, row.clientId),
          sql`lower(${clientBranches.branchName}) = ${branchName.toLowerCase()}`
        )
      )
      .limit(1);
    if (branchRows[0]?.gstin) {
      resolvedGstin = branchRows[0].gstin;
    }
  }

  return { ...row, clientGstin: resolvedGstin, items, template };
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createCreditNote(
  data: Omit<NewCreditNote, "creditNoteNumber"> & { creditNoteNumber?: string },
  items: Omit<NewCreditNoteItem, "creditNoteId">[],
) {
  await requireAuth();
  const finalNumber =
    data.creditNoteNumber || (await getNextDocumentNumber(data.templateId ?? null, "credit_note"));
  const totalAmount = data.totalAmount || items.reduce((sum, item) => sum + item.amount, 0);

  const [creditNote] = await db
    .insert(creditNotes)
    .values({
      ...data,
      templateId: data.templateId as number | null,
      creditNoteNumber: finalNumber,
      totalAmount,
      creditNoteDate: data.creditNoteDate || new Date().toISOString().split("T")[0],
      notes: data.notes,
      showTotal: data.showTotal ?? true,
    })
    .returning();

  if (items.length > 0) {
    await db
      .insert(creditNoteItems)
      .values(items.map((item) => ({ ...item, creditNoteId: creditNote.id })));
  }

  revalidatePath("/credit-notes");
  return creditNote;
}

export async function updateCreditNote(
  id: number,
  data: Partial<NewCreditNote>,
  items?: Omit<NewCreditNoteItem, "creditNoteId">[],
) {
  await requireAuth();

  if (items !== undefined) {
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
    await Promise.all([
      db.update(creditNotes).set({ ...data, totalAmount }).where(eq(creditNotes.id, id)),
      db.delete(creditNoteItems).where(eq(creditNoteItems.creditNoteId, id)),
    ]);
    if (items.length > 0) {
      await db
        .insert(creditNoteItems)
        .values(items.map((item) => ({ ...item, creditNoteId: id })));
    }
  } else {
    await db.update(creditNotes).set(data).where(eq(creditNotes.id, id));
  }

  revalidatePath("/credit-notes");
  revalidatePath(`/credit-notes/${id}`);
}

export async function updateCreditNoteStatus(id: number, status: string) {
  await requireAuth();
  const [row] = await db
    .update(creditNotes)
    .set({ status })
    .where(eq(creditNotes.id, id))
    .returning();
  revalidatePath("/credit-notes");
  return row;
}

export async function deleteCreditNote(id: number) {
  await requireAuth();
  try {
    await db.delete(creditNotes).where(eq(creditNotes.id, id));
    revalidatePath("/credit-notes");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete credit note. Please try again." };
  }
}

export async function cloneCreditNote(id: number) {
  await requireAuth();

  let original = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      original = await getCreditNote(id);
      break;
    } catch (err: any) {
      const isTimeout =
        err?.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
        err?.message?.includes("fetch failed") ||
        err?.message?.includes("Connect Timeout");
      if (isTimeout && attempt < 3) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }
      throw new Error(`Failed to fetch credit note: ${err?.message ?? "Connection timeout"}`);
    }
  }

  if (!original) throw new Error("Credit note not found");

  return createCreditNote(
    {
      invoiceId: original.invoiceId,
      templateId: original.templateId,
      clientId: original.clientId,
      subject: original.subject ? `${original.subject} (Copy)` : null,
      clientBranch: original.clientBranch,
      totalAmount: original.totalAmount,
      status: "issued",
      reason: original.reason,
      notes: original.notes,
      placeOfSupply: original.placeOfSupply,
      creditNoteDate: original.creditNoteDate,
      showTotal: original.showTotal,
    },
    original.items.map(({ description, quantity, rate, taxed, amount }) => ({
      description,
      quantity,
      rate,
      taxed,
      amount,
    })),
  );
}
