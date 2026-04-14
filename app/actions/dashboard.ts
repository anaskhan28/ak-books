"use server";

import { db } from "@/app/db";
import {
  projects, expenses, labourEntries, invoices, clients,
  quotations, scrapEntries, payments, quotationTemplates,
} from "@/app/db/schema";
import { eq, ne, sql, desc, count, sum } from "drizzle-orm";

// ── Helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0];

const SHORT_NAMES: Record<string, string> = {
  "AK Enterprises": "AKE",
  "Vedant Enterprises": "VED",
  "Atique Khan": "ATK",
  "K.G.N. Enterprises": "KGN",
  "Anas Khan Merchant": "AKM",
  "Energy Security": "ESG",
  "Vijay Enterprises": "VIJ",
  "General/Unassigned": "GEN",
};

function shortenTemplateName(name: string) {
  return SHORT_NAMES[name] ?? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 3);
}

// ── Stats (single batched query) ─────────────────────────────────────────────

export async function getDashboardStats() {
  const dateStr = today();

  // Fire ALL aggregation queries in parallel — no sequential waits
  const [
    [activeProjects],
    [workersTodayResult],
    [labourTotal],
    [expenseTotal],
    [incomeTotal],
    unpaidInvoices,
  ] = await Promise.all([
    db.select({ count: count() }).from(projects).where(eq(projects.status, "active")),
    db.select({ total: sum(labourEntries.workersCount) }).from(labourEntries).where(eq(labourEntries.date, dateStr)),
    db.select({ total: sum(labourEntries.totalCost) }).from(labourEntries),
    db.select({ total: sum(expenses.amount) }).from(expenses),
    db.select({ total: sum(invoices.totalAmount) }).from(invoices),
    // Only fetch unpaid invoices (not ALL invoices) for receivable calculations
    db.select({ totalAmount: invoices.totalAmount, status: invoices.status })
      .from(invoices)
      .where(sql`${invoices.status} NOT IN ('paid', 'cancelled')`),
  ]);

  const totalReceivables = unpaidInvoices.reduce((s, inv) => s + Number(inv.totalAmount || 0), 0);
  const unpaidInvoicesCount = unpaidInvoices.length;
  const overdueInvoicesCount = unpaidInvoices.filter((i) => i.status === "overdue").length;
  const overdueInvoicesAmount = unpaidInvoices
    .filter((i) => i.status === "overdue")
    .reduce((s, inv) => s + Number(inv.totalAmount || 0), 0);

  return {
    activeProjects: Number(activeProjects.count),
    workersToday: Number(workersTodayResult.total || 0),
    totalReceivables,
    totalPayables: 0,
    unpaidInvoicesCount,
    overdueInvoicesCount,
    overdueBillsCount: 0,
    overdueInvoicesAmount,
    overdueBillsAmount: 0,
    totalIncome: Number(incomeTotal.total || 0),
    totalExpenses: Number(labourTotal.total || 0) + Number(expenseTotal.total || 0),
    pendingPayments: totalReceivables,
  };
}

// ── Widget queries ───────────────────────────────────────────────────────────

export async function getQuotationPipeline() {
  const result = await db
    .select({ status: quotations.status, count: count(), total: sum(quotations.totalAmount) })
    .from(quotations)
    .groupBy(quotations.status);

  return result.map((r) => ({ status: r.status, count: Number(r.count), total: Number(r.total || 0) }));
}

export async function getSiteAttendanceSummary() {
  const result = await db
    .select({
      projectId: labourEntries.projectId,
      projectName: projects.name,
      workerCount: sum(labourEntries.workersCount),
    })
    .from(labourEntries)
    .leftJoin(projects, eq(labourEntries.projectId, projects.id))
    .where(eq(labourEntries.date, today()))
    .groupBy(labourEntries.projectId, projects.name);

  return result.map((r) => ({
    id: r.projectId,
    name: r.projectName || "Unknown Project",
    count: Number(r.workerCount || 0),
  }));
}

export async function getLatestScrapEntries() {
  return db
    .select({
      id: scrapEntries.id,
      projectName: projects.name,
      type: scrapEntries.type,
      amount: scrapEntries.amount,
      weight: scrapEntries.weight,
      date: scrapEntries.date,
    })
    .from(scrapEntries)
    .leftJoin(projects, eq(scrapEntries.projectId, projects.id))
    .orderBy(desc(scrapEntries.date))
    .limit(5);
}

export async function getProjectDistribution() {
  const result = await db
    .select({ workType: projects.workType, count: count() })
    .from(projects)
    .where(eq(projects.status, "active"))
    .groupBy(projects.workType);

  return result.map((r) => ({ type: r.workType || "Other", count: Number(r.count) }));
}

export async function getRecentProjects() {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      workType: projects.workType,
      status: projects.status,
      location: projects.location,
    })
    .from(projects)
    .where(ne(projects.status, "completed"))
    .orderBy(desc(projects.createdAt))
    .limit(3);
}

export async function getExpenseBreakdown() {
  const CATEGORIES = ["Labor", "Material", "Transport", "Tools & Equipment", "Food & Refreshment", "Miscellaneous"];

  const [allExpenses, [labourResult]] = await Promise.all([
    db.select({ type: expenses.type, amount: expenses.amount }).from(expenses),
    db.select({ total: sum(labourEntries.totalCost) }).from(labourEntries),
  ]);

  const typeMap = new Map<string, number>(CATEGORIES.map((c) => [c, 0]));

  for (const exp of allExpenses) {
    const type = exp.type || "Miscellaneous";
    typeMap.set(type, (typeMap.get(type) || 0) + Number(exp.amount || 0));
  }
  typeMap.set("Labor", (typeMap.get("Labor") || 0) + Number(labourResult.total || 0));

  const total = Array.from(typeMap.values()).reduce((a, b) => a + b, 0);

  return Array.from(typeMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount || CATEGORIES.indexOf(a.name) - CATEGORIES.indexOf(b.name))
    .slice(0, 6);
}

export async function getRecentInvoices() {
  const result = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      total: invoices.totalAmount,
      status: invoices.status,
      client: clients.name,
      date: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.createdAt))
    .limit(5);

  return result.map((inv) => ({
    ...inv,
    client: inv.client || "General Client",
    date: inv.date || new Date(),
  }));
}

export async function getSalesOverview() {
  const [allInvoices, allQuotations, templates] = await Promise.all([
    db.select({ totalAmount: invoices.totalAmount, templateId: invoices.templateId }).from(invoices),
    db.select({ totalAmount: quotations.totalAmount, templateId: quotations.templateId }).from(quotations),
    db.select().from(quotationTemplates),
  ]);

  const invoiceTotal = allInvoices.reduce((s, inv) => s + Number(inv.totalAmount || 0), 0);
  const quotationTotal = allQuotations.reduce((s, q) => s + Number(q.totalAmount || 0), 0);

  let templateStats = templates.map((t) => {
    const tInv = allInvoices.filter((i) => i.templateId === t.id);
    const tQuot = allQuotations.filter((q) => q.templateId === t.id);
    return {
      name: t.name,
      shortName: shortenTemplateName(t.name),
      invoices: { count: tInv.length, value: tInv.reduce((s, i) => s + Number(i.totalAmount || 0), 0) },
      quotations: { count: tQuot.length, value: tQuot.reduce((s, q) => s + Number(q.totalAmount || 0), 0) },
    };
  }).filter((s) => s.invoices.count > 0 && s.quotations.count > 0);

  const unassignedInv = allInvoices.filter((i) => !i.templateId);
  const unassignedQt = allQuotations.filter((q) => !q.templateId);

  if (unassignedInv.length > 0 && unassignedQt.length > 0) {
    templateStats.push({
      name: "General/Unassigned",
      shortName: "GEN",
      invoices: { count: unassignedInv.length, value: unassignedInv.reduce((s, i) => s + Number(i.totalAmount || 0), 0) },
      quotations: { count: unassignedQt.length, value: unassignedQt.reduce((s, q) => s + Number(q.totalAmount || 0), 0) },
    });
  }

  return {
    invoices: { count: allInvoices.length, value: invoiceTotal },
    quotations: { count: allQuotations.length, value: quotationTotal },
    templateStats,
  };
}

export async function getRecentInwardPayments() {
  return db
    .select({
      id: payments.id,
      amount: payments.amount,
      date: payments.paymentDate,
      client: clients.name,
      invoiceNumber: invoices.invoiceNumber,
      method: payments.paymentMethod,
    })
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(payments.paymentDate))
    .limit(5);
}

export async function getMonthlyExpenseChart() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Parallel: expenses, labour, income all at once
  const [expenseResult, labourResult, incomeResult] = await Promise.all([
    db.select({
      month: sql<string>`TO_CHAR(${expenses.date}::date, 'Mon')`,
      amount: sql<number>`sum(${expenses.amount})`,
    }).from(expenses).groupBy(sql`TO_CHAR(${expenses.date}::date, 'Mon')`),

    db.select({
      month: sql<string>`TO_CHAR(${labourEntries.date}::date, 'Mon')`,
      amount: sql<number>`sum(${labourEntries.totalCost})`,
    }).from(labourEntries).groupBy(sql`TO_CHAR(${labourEntries.date}::date, 'Mon')`),

    db.select({
      month: sql<string>`TO_CHAR(${invoices.createdAt}::date, 'Mon')`,
      income: sql<number>`sum(${invoices.totalAmount})`,
    }).from(invoices).groupBy(sql`TO_CHAR(${invoices.createdAt}::date, 'Mon')`),
  ]);

  return months.map((m) => ({
    month: m,
    expense: Number(expenseResult.find((r) => r.month === m)?.amount || 0) +
             Number(labourResult.find((r) => r.month === m)?.amount || 0),
    income: Number(incomeResult.find((r) => r.month === m)?.income || 0),
  }));
}

export async function getTopClients() {
  const result = await db
    .select({ id: clients.id, name: clients.name, amount: sum(invoices.totalAmount) })
    .from(clients)
    .innerJoin(invoices, eq(clients.id, invoices.clientId))
    .groupBy(clients.id, clients.name)
    .orderBy(desc(sql`sum(${invoices.totalAmount})`))
    .limit(3);

  return result.map((r) => ({ ...r, amount: Number(r.amount || 0) }));
}
