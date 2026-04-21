"use server";

import { db } from "@/app/db";
import { projects, clients, type NewProject } from "@/app/db/schema";
import { eq, ne, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Standard revalidation for projects
 */
function revalidateProjects(id?: number) {
  revalidatePath("/projects");
  revalidatePath("/");
  if (id) revalidatePath(`/projects/${id}`);
}

/**
 * Fetches all projects with client names, ordered by newest first
 */
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
    .orderBy(desc(projects.createdAt));
}

/**
 * Fetches a single project record with client details
 */
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

/**
 * Creates a new project
 */
export async function createProject(data: NewProject) {
  const [project] = await db.insert(projects).values(data).returning();
  revalidateProjects();
  return project;
}

/**
 * Updates an existing project
 */
export async function updateProject(id: number, data: Partial<NewProject>) {
  const [project] = await db
    .update(projects)
    .set(data)
    .where(eq(projects.id, id))
    .returning();
  revalidateProjects(id);
  return project;
}

/**
 * Deletes a project
 */
export async function deleteProject(id: number) {
  await db.delete(projects).where(eq(projects.id, id));
  revalidateProjects();
}

/**
 * Counts all non-completed projects
 */
export async function getActiveProjectCount() {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(ne(projects.status, "completed"));
  return Number(result.count);
}
