"use server";

import { db } from "@/app/db";
import {
  quotations,
  quotationItems,
  quotationTemplates,
  clients,
  clientBranches,
  projects,
  invoices,
  type NewQuotation,
  type NewQuotationItem,
} from "@/app/db/schema";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { getTemplateConfig } from "@/lib/pdf-templates/registry";

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
      placeOfSupply: quotations.placeOfSupply,
      quotationDate: quotations.quotationDate,
      showTotal: quotations.showTotal,
      isComparative: quotations.isComparative,
      createdAt: quotations.createdAt,
    })
    .from(quotations)
    .leftJoin(clients, eq(quotations.clientId, clients.id))
    .leftJoin(projects, eq(quotations.projectId, projects.id))
    .leftJoin(quotationTemplates, eq(quotations.templateId, quotationTemplates.id))
    .orderBy(desc(quotations.createdAt)); // newest first

  if (templateId) {
    return query.where(eq(quotations.templateId, templateId));
  }
  return query;
}

/** Fetches quotation + items + template in a single round-trip (3 parallel queries) */
export async function getQuotation(id: number) {
  const [rows, items, allTemplates] = await Promise.all([
    db
      .select({
        id: quotations.id,
        templateId: quotations.templateId,
        clientId: quotations.clientId,
        clientName: clients.name,
        clientPhone: clients.phone,
        clientEmail: clients.email,
        clientAddress: clients.address,
        clientGstin: clients.gstin,
        projectId: quotations.projectId,
        projectName: projects.name,
        quotationNumber: quotations.quotationNumber,
        subject: quotations.subject,
        clientBranch: quotations.clientBranch,
        totalAmount: quotations.totalAmount,
        status: quotations.status,
        notes: quotations.notes,
        placeOfSupply: quotations.placeOfSupply,
        quotationDate: quotations.quotationDate,
        showTotal: quotations.showTotal,
        isComparative: quotations.isComparative,
        createdAt: quotations.createdAt,
      })
      .from(quotations)
      .leftJoin(clients, eq(quotations.clientId, clients.id))
      .leftJoin(projects, eq(quotations.projectId, projects.id))
      .where(eq(quotations.id, id)),
    db.select().from(quotationItems).where(eq(quotationItems.quotationId, id)),
    db.select().from(quotationTemplates), // small table, cached well by Neon
  ]);

  const row = rows[0];
  if (!row) return null;

  const template = row.templateId
    ? allTemplates.find((t) => t.id === row.templateId) ?? null
    : null;

  // Resolve branch-specific GSTIN if present
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

// ── Number generation ────────────────────────────────────────────────────────

export async function getNextDocumentNumber(templateId: number | null, isInvoice: boolean) {
  const [dbTemplate] = templateId
    ? await db.select().from(quotationTemplates).where(eq(quotationTemplates.id, templateId))
    : [null];

  const cfg = getTemplateConfig(dbTemplate?.name, dbTemplate ?? undefined);
  const prefix = isInvoice ? cfg.invoicePrefix : cfg.prefix;

  const existing = isInvoice
    ? await db
        .select({ num: invoices.invoiceNumber })
        .from(invoices)
        .where(like(invoices.invoiceNumber, `${prefix}%`))
        .orderBy(desc(invoices.id))
        .limit(50)
    : await db
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
  await requireAuth();
  const finalQuotationNumber =
    data.quotationNumber || (await getNextDocumentNumber(data.templateId ?? null, false));
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
      showTotal: data.showTotal ?? true,
      isComparative: data.isComparative ?? false,
    })
    .returning();

  if (items.length > 0) {
    await db
      .insert(quotationItems)
      .values(items.map((item) => ({ ...item, quotationId: quotation.id })));
  }

  revalidatePath("/quotations");
  return quotation;
}

export async function updateQuotation(
  id: number,
  data: Partial<NewQuotation>,
  items?: Omit<NewQuotationItem, "quotationId">[],
) {
  await requireAuth();

  if (items !== undefined) {
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

    // Update quotation and wipe old items in parallel, then insert new items
    await Promise.all([
      db.update(quotations).set({ ...data, totalAmount }).where(eq(quotations.id, id)),
      db.delete(quotationItems).where(eq(quotationItems.quotationId, id)),
    ]);

    if (items.length > 0) {
      await db
        .insert(quotationItems)
        .values(items.map((item) => ({ ...item, quotationId: id })));
    }
  } else {
    await db.update(quotations).set(data).where(eq(quotations.id, id));
  }

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
}

export async function updateQuotationStatus(id: number, status: string) {
  await requireAuth();
  const [row] = await db
    .update(quotations)
    .set({ status })
    .where(eq(quotations.id, id))
    .returning();
  revalidatePath("/quotations");
  return row;
}

export async function deleteQuotation(id: number) {
  await requireAuth();
  try {
    await db.delete(quotations).where(eq(quotations.id, id));
    revalidatePath("/quotations");
    return { success: true };
  } catch (error: any) {
    if (error.code === "23503") {
      return {
        success: false,
        error: "This quotation is linked to an invoice and cannot be deleted. Please delete the invoice first.",
      };
    }
    return { success: false, error: "Failed to delete quotation. Please try again." };
  }
}

export async function cloneQuotation(id: number) {
  await requireAuth();

  // Retry up to 3 times to handle Neon cold-start connection timeouts
  let original = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      original = await getQuotation(id);
      break;
    } catch (err: any) {
      const isTimeout =
        err?.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
        err?.message?.includes("fetch failed") ||
        err?.message?.includes("Connect Timeout");
      if (isTimeout && attempt < 3) {
        console.warn(`cloneQuotation: DB timeout on attempt ${attempt}, retrying...`);
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }
      throw new Error(`Failed to fetch quotation: ${err?.message ?? "Connection timeout"}`);
    }
  }

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
      placeOfSupply: original.placeOfSupply,
      quotationDate: original.quotationDate,
      showTotal: original.showTotal,
      isComparative: original.isComparative,
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
