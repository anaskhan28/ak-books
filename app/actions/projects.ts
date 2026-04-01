"use server";

import { db } from "@/app/db";
import { projects, clients, type NewProject } from "@/app/db/schema";
import { eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProjects() {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      clientId: projects.clientId,
      clientName: clients.name,
      workType: projects.workType,
      startDate: projects.startDate,
      endDate: projects.endDate,
      status: projects.status,
      description: projects.description,
      location: projects.location,
      quotedAmount: projects.quotedAmount,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .orderBy(projects.createdAt);
}

export async function getProject(id: number) {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientId: projects.clientId,
      clientName: clients.name,
      workType: projects.workType,
      startDate: projects.startDate,
      endDate: projects.endDate,
      status: projects.status,
      description: projects.description,
      location: projects.location,
      quotedAmount: projects.quotedAmount,
      notes: projects.notes,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.id, id));
  return rows[0] ?? null;
}

export async function createProject(data: NewProject) {
  const rows = await db.insert(projects).values(data).returning();
  revalidatePath("/projects");
  revalidatePath("/");
  return rows[0];
}

export async function updateProject(id: number, data: Partial<NewProject>) {
  const rows = await db
    .update(projects)
    .set(data)
    .where(eq(projects.id, id))
    .returning();
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
  return rows[0];
}

export async function deleteProject(id: number) {
  await db.delete(projects).where(eq(projects.id, id));
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function getActiveProjectCount() {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(ne(projects.status, "completed"));
  return Number(rows[0].count);
}
