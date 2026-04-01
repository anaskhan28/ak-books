"use server";

import { db } from "@/app/db";
import { clients, type NewClient } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getClients() {
  return db.select().from(clients).orderBy(clients.name);
}

export async function getClient(id: number) {
  const rows = await db.select().from(clients).where(eq(clients.id, id));
  return rows[0] ?? null;
}

export async function createClient(data: NewClient) {
  const rows = await db.insert(clients).values(data).returning();
  revalidatePath("/clients");
  revalidatePath("/");
  return rows[0];
}

export async function updateClient(id: number, data: Partial<NewClient>) {
  const rows = await db
    .update(clients)
    .set(data)
    .where(eq(clients.id, id))
    .returning();
  revalidatePath("/clients");
  return rows[0];
}

export async function deleteClient(id: number) {
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/clients");
  revalidatePath("/");
}
