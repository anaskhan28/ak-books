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
import { eq, sql, count, desc, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
    .leftJoin(
      quotationTemplates,
      eq(quotations.templateId, quotationTemplates.id),
    )
    .orderBy(quotations.createdAt);

  if (templateId) {
    return query.where(eq(quotations.templateId, templateId));
  }
  return query;
}

export async function getQuotation(id: number) {
  const rows = await db
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
    .where(eq(quotations.id, id));

  if (!rows[0]) return null;

  const items = await db
    .select()
    .from(quotationItems)
    .where(eq(quotationItems.quotationId, id));

  let template = null;
  if (rows[0].templateId) {
    const tRows = await db
      .select()
      .from(quotationTemplates)
      .where(eq(quotationTemplates.id, rows[0].templateId));
    template = tRows[0] ?? null;
  }

  return { ...rows[0], items, template };
}

export async function getNextDocumentNumber(templateId: number | null, isInvoice: boolean) {
  let templateName: string | null = null;
  if (templateId) {
    const tRows = await db
      .select({ name: quotationTemplates.name })
      .from(quotationTemplates)
      .where(eq(quotationTemplates.id, templateId));
    templateName = tRows[0]?.name ?? null;
  }

  const { getTemplateConfig } = await import("@/lib/pdf-templates/registry");
  const cfg = getTemplateConfig(templateName);
  const prefix = isInvoice ? cfg.invoicePrefix : cfg.prefix;

  const existing = await db
    .select({ num: quotations.quotationNumber })
    .from(quotations)
    .where(like(quotations.quotationNumber, `${prefix}%`)) // match prefix exactly
    .orderBy(desc(quotations.id))
    .limit(50);

  let nextSeq = 1;
  const regex = new RegExp(`${prefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}-(\\d+)`);

  for (const row of existing) {
    const match = row.num.match(regex);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= nextSeq) nextSeq = n + 1;
    }
  }

  return `${prefix}-${String(nextSeq).padStart(2, "0")}`;
}

export async function createQuotation(
  data: Omit<NewQuotation, "quotationNumber"> & { quotationNumber?: string },
  items: Omit<NewQuotationItem, "quotationId">[],
) {
  let finalQuotationNumber = data.quotationNumber;

  if (!finalQuotationNumber) {
     finalQuotationNumber = await getNextDocumentNumber(data.templateId ?? null, false);
  }

  const totalAmount =
    data.totalAmount || items.reduce((sum, item) => sum + item.amount, 0);

  const [quotation] = await db
    .insert(quotations)
    .values({ 
      ...data, 
      templateId: data.templateId as number | null,
      quotationNumber: finalQuotationNumber as string, 
      totalAmount,
      quotationDate: data.quotationDate || new Date().toISOString().split("T")[0],
      notes: data.notes
    })
    .returning();

  if (items.length > 0) {
    await db.insert(quotationItems).values(
      items.map((item) => ({
        ...item,
        quotationId: quotation.id,
      })),
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
    await db
      .update(quotations)
      .set({ ...data, totalAmount })
      .where(eq(quotations.id, id));

    await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));

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
  const rows = await db
    .update(quotations)
    .set({ status })
    .where(eq(quotations.id, id))
    .returning();
  revalidatePath("/quotations");
  return rows[0];
}

export async function deleteQuotation(id: number) {
  await db.delete(quotations).where(eq(quotations.id, id));
  revalidatePath("/quotations");
}

export async function cloneQuotation(id: number) {
  const original = await getQuotation(id);
  if (!original) throw new Error("Quotation not found");

  const { 
    templateId, 
    clientId, 
    projectId, 
    subject, 
    clientBranch, 
    totalAmount, 
    notes,
    quotationDate
  } = original;

  const clonedItems = original.items.map((i) => ({
    description: i.description,
    quantity: i.quantity,
    rate: i.rate,
    taxed: i.taxed,
    amount: i.amount,
  }));

  const cloned = await createQuotation(
    {
      templateId,
      clientId,
      projectId,
      subject: subject ? `${subject} (Copy)` : null,
      clientBranch,
      totalAmount,
      status: "draft",
      notes,
      quotationDate
    },
    clonedItems
  );

  return cloned;
}
