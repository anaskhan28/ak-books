"use server";

import { db } from "@/app/db";
import { labourEntries, projects, type NewLabourEntry } from "@/app/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { todayISO } from "@/lib/utils";

/**
 * Standard revalidation for labour entries
 */
function revalidateLabour(projectId?: number) {
  revalidatePath("/labour");
  revalidatePath("/");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

/**
 * Fetches labour entries with project names, newest first
 */
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

/**
 * Adds a new labour entry
 */
export async function addLabourEntry(data: NewLabourEntry) {
  const [entry] = await db.insert(labourEntries).values(data).returning();
  revalidateLabour(data.projectId);
  return entry;
}

/**
 * Deletes a labour entry record
 */
export async function deleteLabourEntry(id: number) {
  const [entry] = await db
    .select({ projectId: labourEntries.projectId })
    .from(labourEntries)
    .where(eq(labourEntries.id, id))
    .limit(1);

  await db.delete(labourEntries).where(eq(labourEntries.id, id));
  revalidateLabour(entry?.projectId);
}

/**
 * Optimized fetch of total workers count for today
 */
export async function getWorkersToday() {
  const today = todayISO();
  const [result] = await db
    .select({
      total: sql<number>`coalesce(sum(${labourEntries.workersCount}), 0)`,
    })
    .from(labourEntries)
    .where(eq(labourEntries.date, today));
  return Number(result.total);
}

/**
 * Calculates sum of labour costs for a project
 */
export async function getProjectLabourTotal(projectId: number) {
  const [result] = await db
    .select({
      total: sql<number>`coalesce(sum(${labourEntries.totalCost}), 0)`,
    })
    .from(labourEntries)
    .where(eq(labourEntries.projectId, projectId));
  return Number(result.total);
}

/**
 * Optimized fetch of all project labour statistics in one go
 */
export async function getAllProjectLabourStats() {
  const rows = await db
    .select({
      projectId: labourEntries.projectId,
      totalWorkers: sql<number>`coalesce(sum(${labourEntries.workersCount}), 0)`,
      totalCost: sql<number>`coalesce(sum(${labourEntries.totalCost}), 0)`,
    })
    .from(labourEntries)
    .groupBy(labourEntries.projectId);

  return new Map(
    rows.map((r) => [
      r.projectId,
      {
        workers: Number(r.totalWorkers),
        cost: Number(r.totalCost),
      },
    ])
  );
}
