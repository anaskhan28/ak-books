"use server";

import { db } from "@/app/db";
import { expenses, projects, type NewExpense } from "@/app/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { startOfMonthISO, todayISO } from "@/lib/utils";

export async function getExpenses(projectId?: number) {
  const query = db
    .select({
      id: expenses.id,
      projectId: expenses.projectId,
      projectName: projects.name,
      type: expenses.type,
      description: expenses.description,
      amount: expenses.amount,
      date: expenses.date,
    })
    .from(expenses)
    .leftJoin(projects, eq(expenses.projectId, projects.id))
    .orderBy(expenses.date);

  if (projectId) {
    return query.where(eq(expenses.projectId, projectId));
  }
  return query;
}

export async function addExpense(data: NewExpense) {
  const rows = await db.insert(expenses).values(data).returning();
  revalidatePath("/expenses");
  revalidatePath(`/projects/${data.projectId}`);
  revalidatePath("/");
  return rows[0];
}

export async function deleteExpense(id: number) {
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/expenses");
  revalidatePath("/");
}

export async function getMonthlyExpenseTotal() {
  const monthStart = startOfMonthISO();
  const today = todayISO();
  const rows = await db
    .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .where(and(gte(expenses.date, monthStart), lte(expenses.date, today)));
  return Number(rows[0].total);
}

export async function getProjectExpenseTotal(projectId: number) {
  const rows = await db
    .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .where(eq(expenses.projectId, projectId));
  return Number(rows[0].total);
}

export async function getAllProjectExpenseTotals() {
  const rows = await db
    .select({
      projectId: expenses.projectId,
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .groupBy(expenses.projectId);
  const map = new Map<number, number>();
  for (const r of rows) {
    map.set(r.projectId, Number(r.total));
  }
  return map;
}
