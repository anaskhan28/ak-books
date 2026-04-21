"use server";

import { db } from "@/app/db";
import {
  quotations,
  quotationItems,
  quotationTemplates,
  clients,
  projects,
  type NewQuotation,
  type NewQuotationItem,
} from "@/app/db/schema";
import { eq, desc, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getQuotations(templateId?: number) {
  const query = db
    .select({
      id: quotations.id,
      templateId: quotations.templateId,
      templateName: quotationTemplates.name,
      clientId: quotations.clientId,
      clientName: clients.name,
      projectId: quotations.projectId,
      projectName: projects.name,
      quotationNumber: quotations.quotationNumber,
      subject: quotations.subject,
      clientBranch: quotations.clientBranch,
      totalAmount: quotations.totalAmount,
      status: quotations.status,
      notes: quotations.notes,
      quotationDate: quotations.quotationDate,
      createdAt: quotations.createdAt,
    })
    .from(quotations)
    .leftJoin(clients, eq(quotations.clientId, clients.id))
    .leftJoin(projects, eq(quotations.projectId, projects.id))
    .leftJoin(quotationTemplates, eq(quotations.templateId, quotationTemplates.id))
    .orderBy(quotations.createdAt);

  if (templateId) {
    return query.where(eq(quotations.templateId, templateId));
  }
  return query;
}

/** Single optimized query — fetches quotation + items + template in parallel */
export async function getQuotation(id: number) {
  const [rows, items] = await Promise.all([
    db
      .select({
        id: quotations.id,
        templateId: quotations.templateId,
        clientId: quotations.clientId,
        clientName: clients.name,
        clientPhone: clients.phone,
        clientEmail: clients.email,
        clientAddress: clients.address,
        projectId: quotations.projectId,
        projectName: projects.name,
        quotationNumber: quotations.quotationNumber,
        subject: quotations.subject,
        clientBranch: quotations.clientBranch,
        totalAmount: quotations.totalAmount,
        status: quotations.status,
        notes: quotations.notes,
        quotationDate: quotations.quotationDate,
        createdAt: quotations.createdAt,
      })
      .from(quotations)
      .leftJoin(clients, eq(quotations.clientId, clients.id))
      .leftJoin(projects, eq(quotations.projectId, projects.id))
      .where(eq(quotations.id, id)),
    db.select().from(quotationItems).where(eq(quotationItems.quotationId, id)),
  ]);

  if (!rows[0]) return null;

  // Resolve template only if needed (still fast — single indexed lookup)
  let template = null;
  if (rows[0].templateId) {
    const [t] = await db
      .select()
      .from(quotationTemplates)
      .where(eq(quotationTemplates.id, rows[0].templateId));
    template = t ?? null;
  }

  return { ...rows[0], items, template };
}

// ── Number generation ────────────────────────────────────────────────────────

export async function getNextDocumentNumber(templateId: number | null, isInvoice: boolean) {
  let dbTemplate = null;
  if (templateId) {
    const [row] = await db
      .select()
      .from(quotationTemplates)
      .where(eq(quotationTemplates.id, templateId));
    dbTemplate = row ?? null;
  }

  const { getTemplateConfig } = await import("@/lib/pdf-templates/registry");
  const cfg = getTemplateConfig(dbTemplate?.name, dbTemplate);
  const prefix = isInvoice ? cfg.invoicePrefix : cfg.prefix;

  const existing = await db
    .select({ num: quotations.quotationNumber })
    .from(quotations)
    .where(like(quotations.quotationNumber, `${prefix}%`))
    .orderBy(desc(quotations.id))
    .limit(50);

  let nextSeq = 1;
  const escaped = prefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const regex = new RegExp(`${escaped}-(\\d+)`);

  for (const row of existing) {
    const match = row.num.match(regex);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= nextSeq) nextSeq = n + 1;
    }
  }

  return `${prefix}-${String(nextSeq).padStart(2, "0")}`;
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createQuotation(
  data: Omit<NewQuotation, "quotationNumber"> & { quotationNumber?: string },
  items: Omit<NewQuotationItem, "quotationId">[],
) {
  const finalQuotationNumber = data.quotationNumber || await getNextDocumentNumber(data.templateId ?? null, false);
  const totalAmount = data.totalAmount || items.reduce((sum, item) => sum + item.amount, 0);

  const [quotation] = await db
    .insert(quotations)
    .values({
      ...data,
      templateId: data.templateId as number | null,
      quotationNumber: finalQuotationNumber,
      totalAmount,
      quotationDate: data.quotationDate || new Date().toISOString().split("T")[0],
      notes: data.notes,
    })
    .returning();

  if (items.length > 0) {
    await db.insert(quotationItems).values(
      items.map((item) => ({ ...item, quotationId: quotation.id })),
    );
  }

  revalidatePath("/quotations");
  return quotation;
}

export async function updateQuotation(
  id: number,
  data: Partial<NewQuotation>,
  items?: Omit<NewQuotationItem, "quotationId">[],
) {
  if (items) {
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
    await Promise.all([
      db.update(quotations).set({ ...data, totalAmount }).where(eq(quotations.id, id)),
      db.delete(quotationItems).where(eq(quotationItems.quotationId, id)),
    ]);

    if (items.length > 0) {
      await db.insert(quotationItems).values(items.map((item) => ({ ...item, quotationId: id })));
    }
  } else {
    await db.update(quotations).set(data).where(eq(quotations.id, id));
  }

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
}

export async function updateQuotationStatus(id: number, status: string) {
  const [row] = await db.update(quotations).set({ status }).where(eq(quotations.id, id)).returning();
  revalidatePath("/quotations");
  return row;
}

export async function deleteQuotation(id: number) {
  await db.delete(quotations).where(eq(quotations.id, id));
  revalidatePath("/quotations");
}

export async function cloneQuotation(id: number) {
  const original = await getQuotation(id);
  if (!original) throw new Error("Quotation not found");

  return createQuotation(
    {
      templateId: original.templateId,
      clientId: original.clientId,
      projectId: original.projectId,
      subject: original.subject ? `${original.subject} (Copy)` : null,
      clientBranch: original.clientBranch,
      totalAmount: original.totalAmount,
      status: "draft",
      notes: original.notes,
      quotationDate: original.quotationDate,
    },
    original.items.map(({ description, quantity, rate, taxed, amount }) => ({
      description, quantity, rate, taxed, amount,
    })),
  );
}
