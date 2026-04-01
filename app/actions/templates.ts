"use server";

import { db } from "@/app/db";
import { quotationTemplates, type NewQuotationTemplate } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTemplates() {
  return db
    .select()
    .from(quotationTemplates)
    .orderBy(quotationTemplates.createdAt);
}

export async function getTemplate(id: number) {
  const rows = await db
    .select()
    .from(quotationTemplates)
    .where(eq(quotationTemplates.id, id));
  return rows[0] ?? null;
}

export async function createTemplate(data: NewQuotationTemplate) {
  const rows = await db.insert(quotationTemplates).values(data).returning();
  revalidatePath("/quotations");
  return rows[0];
}

export async function updateTemplate(
  id: number,
  data: Partial<NewQuotationTemplate>,
) {
  const rows = await db
    .update(quotationTemplates)
    .set(data)
    .where(eq(quotationTemplates.id, id))
    .returning();
  revalidatePath("/quotations");
  return rows[0];
}

export async function deleteTemplate(id: number) {
  await db.delete(quotationTemplates).where(eq(quotationTemplates.id, id));
  revalidatePath("/quotations");
}
