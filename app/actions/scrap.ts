"use server";

import { db } from "@/app/db";
import { scrapEntries, projects, type NewScrapEntry } from "@/app/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getScrapEntries(projectId: number) {
  return db
    .select({
      id: scrapEntries.id,
      projectId: scrapEntries.projectId,
      type: scrapEntries.type,
      description: scrapEntries.description,
      weight: scrapEntries.weight,
      amount: scrapEntries.amount,
      date: scrapEntries.date,
      notes: scrapEntries.notes,
    })
    .from(scrapEntries)
    .where(eq(scrapEntries.projectId, projectId))
    .orderBy(desc(scrapEntries.date));
}

export async function addScrapEntry(data: NewScrapEntry) {
  const rows = await db.insert(scrapEntries).values(data).returning();
  revalidatePath(`/projects/${data.projectId}`);
  return rows[0];
}

export async function deleteScrapEntry(id: number) {
  await db.delete(scrapEntries).where(eq(scrapEntries.id, id));
  revalidatePath("/");
}

export async function getScrapTotals(projectId: number) {
  const rows = await db
    .select({
      type: scrapEntries.type,
      total: sql<number>`coalesce(sum(${scrapEntries.amount}), 0)`,
    })
    .from(scrapEntries)
    .where(eq(scrapEntries.projectId, projectId))
    .groupBy(scrapEntries.type);

  let purchased = 0;
  let sold = 0;
  for (const r of rows) {
    if (r.type === "purchase") purchased = Number(r.total);
    if (r.type === "sale") sold = Number(r.total);
  }
  return { purchased, sold, profit: sold - purchased };
}

export async function getAllProjectScrapProfits() {
  const rows = await db
    .select({
      projectId: scrapEntries.projectId,
      type: scrapEntries.type,
      total: sql<number>`coalesce(sum(${scrapEntries.amount}), 0)`,
    })
    .from(scrapEntries)
    .groupBy(scrapEntries.projectId, scrapEntries.type);

  const map = new Map<number, number>();
  for (const r of rows) {
    const prev = map.get(r.projectId) || 0;
    const amount = Number(r.total);
    map.set(r.projectId, prev + (r.type === "sale" ? amount : -amount));
  }
  return map;
}
