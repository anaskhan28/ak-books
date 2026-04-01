"use server";

import { db } from "@/app/db";
import { workers, type NewWorker } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getWorkers() {
  return db.select().from(workers).orderBy(workers.name);
}

export async function getActiveWorkers() {
  return db
    .select()
    .from(workers)
    .where(eq(workers.active, true))
    .orderBy(workers.name);
}

export async function getWorker(id: number) {
  const rows = await db.select().from(workers).where(eq(workers.id, id));
  return rows[0] ?? null;
}

export async function createWorker(data: NewWorker) {
  const rows = await db.insert(workers).values(data).returning();
  revalidatePath("/workers");
  return rows[0];
}

export async function updateWorker(id: number, data: Partial<NewWorker>) {
  const rows = await db
    .update(workers)
    .set(data)
    .where(eq(workers.id, id))
    .returning();
  revalidatePath("/workers");
  return rows[0];
}

export async function deleteWorker(id: number) {
  await db.delete(workers).where(eq(workers.id, id));
  revalidatePath("/workers");
}
