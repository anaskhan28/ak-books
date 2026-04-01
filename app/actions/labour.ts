"use server";

import { db } from "@/app/db";
import { labourEntries, projects, type NewLabourEntry } from "@/app/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { todayISO } from "@/lib/utils";

export async function getLabourEntries(projectId?: number) {
  const query = db
    .select({
      id: labourEntries.id,
      projectId: labourEntries.projectId,
      projectName: projects.name,
      date: labourEntries.date,
      workersCount: labourEntries.workersCount,
      totalCost: labourEntries.totalCost,
      notes: labourEntries.notes,
    })
    .from(labourEntries)
    .leftJoin(projects, eq(labourEntries.projectId, projects.id))
    .orderBy(desc(labourEntries.date));

  if (projectId) {
    return query.where(eq(labourEntries.projectId, projectId));
  }
  return query;
}

export async function addLabourEntry(data: NewLabourEntry) {
  const rows = await db.insert(labourEntries).values(data).returning();
  revalidatePath("/labour");
  revalidatePath(`/projects/${data.projectId}`);
  revalidatePath("/");
  return rows[0];
}

export async function deleteLabourEntry(id: number) {
  await db.delete(labourEntries).where(eq(labourEntries.id, id));
  revalidatePath("/labour");
  revalidatePath("/");
}

export async function getWorkersToday() {
  const today = todayISO();
  const rows = await db
    .select({
      total: sql<number>`coalesce(sum(${labourEntries.workersCount}), 0)`,
    })
    .from(labourEntries)
    .where(eq(labourEntries.date, today));
  return Number(rows[0].total);
}

export async function getProjectLabourTotal(projectId: number) {
  const rows = await db
    .select({
      total: sql<number>`coalesce(sum(${labourEntries.totalCost}), 0)`,
    })
    .from(labourEntries)
    .where(eq(labourEntries.projectId, projectId));
  return Number(rows[0].total);
}

export async function getAllProjectLabourStats() {
  const rows = await db
    .select({
      projectId: labourEntries.projectId,
      totalWorkers: sql<number>`coalesce(sum(${labourEntries.workersCount}), 0)`,
      totalCost: sql<number>`coalesce(sum(${labourEntries.totalCost}), 0)`,
    })
    .from(labourEntries)
    .groupBy(labourEntries.projectId);
  const map = new Map<number, { workers: number; cost: number }>();
  for (const r of rows) {
    map.set(r.projectId, {
      workers: Number(r.totalWorkers),
      cost: Number(r.totalCost),
    });
  }
  return map;
}
