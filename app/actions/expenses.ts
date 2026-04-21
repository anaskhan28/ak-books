"use server";

import { db } from "@/app/db";
import { expenses, projects, type NewExpense } from "@/app/db/schema";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { startOfMonthISO, todayISO } from "@/lib/utils";

/**
 * Standard revalidation for expenses
 */
function revalidateExpenses(projectId?: number) {
  revalidatePath("/expenses");
  revalidatePath("/");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

/**
 * Fetches all expenses with joined project names
 */
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
    .orderBy(desc(expenses.date));

  if (projectId) {
    return query.where(eq(expenses.projectId, projectId));
  }
  return query;
}

/**
 * Adds a new expense record
 */
export async function addExpense(data: NewExpense) {
  const [rows] = await db.insert(expenses).values(data).returning();
  revalidateExpenses(data.projectId);
  return rows;
}

/**
 * Deletes an expense record
 */
export async function deleteExpense(id: number) {
  const [expense] = await db
    .select({ projectId: expenses.projectId })
    .from(expenses)
    .where(eq(expenses.id, id))
    .limit(1);

  await db.delete(expenses).where(eq(expenses.id, id));
  revalidateExpenses(expense?.projectId);
}

/**
 * Calculates monthly total for the current month
 */
export async function getMonthlyExpenseTotal() {
  const monthStart = startOfMonthISO();
  const today = todayISO();
  const [result] = await db
    .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .where(and(gte(expenses.date, monthStart), lte(expenses.date, today)));
  return Number(result.total);
}

/**
 * Fetches sum of expenses for a specific project
 */
export async function getProjectExpenseTotal(projectId: number) {
  const [result] = await db
    .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .where(eq(expenses.projectId, projectId));
  return Number(result.total);
}

/**
 * Optimized fetch of expense totals for all projects at once
 */
export async function getAllProjectExpenseTotals() {
  const rows = await db
    .select({
      projectId: expenses.projectId,
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .groupBy(expenses.projectId);

  return new Map(rows.map(r => [r.projectId, Number(r.total)]));
}
