"use server";

import { db } from "@/app/db";
import { quotationTemplates, type NewQuotationTemplate } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTemplates() {
  return db.select().from(quotationTemplates).orderBy(quotationTemplates.name);
}

export async function getTemplate(id: number) {
  const [row] = await db
    .select()
    .from(quotationTemplates)
    .where(eq(quotationTemplates.id, id));
  return row ?? null;
}

export async function createTemplate(data: NewQuotationTemplate) {
  const [row] = await db
    .insert(quotationTemplates)
    .values(data)
    .returning();
  
  revalidatePath("/quotations");
  revalidatePath("/quotations/templates");
  return row;
}

export async function updateTemplate(id: number, data: Partial<NewQuotationTemplate>) {
  const [row] = await db
    .update(quotationTemplates)
    .set(data)
    .where(eq(quotationTemplates.id, id))
    .returning();
  
  revalidatePath("/quotations");
  revalidatePath("/quotations/templates");
  return row;
}

export async function deleteTemplate(id: number) {
  await db.delete(quotationTemplates).where(eq(quotationTemplates.id, id));
  revalidatePath("/quotations");
  revalidatePath("/quotations/templates");
}
