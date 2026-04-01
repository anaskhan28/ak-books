"use server";

import { getActiveProjectCount } from "./projects";
import { getMonthlyExpenseTotal } from "./expenses";
import { getPendingPayments } from "./payments";
import { db } from "@/app/db";
import { projects, expenses, labourEntries, invoices, clients, quotations, scrapEntries, payments, quotationTemplates } from "@/app/db/schema";
import { eq, ne, sql, desc, count, sum } from "drizzle-orm";

export async function getWorkersToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateStr = today.toISOString().split('T')[0];

  const result = await db.select({
    totalWorkers: sum(labourEntries.workersCount)
  })
  .from(labourEntries)
  .where(eq(labourEntries.date, dateStr));

  return Number(result[0].totalWorkers || 0);
}

export async function getDashboardStats() {
  const [
    activeProjects, 
    workersTodayCount, 
    invoicesResult,
  ] = await Promise.all([
    getActiveProjectCount(),
    getWorkersToday(),
    db.select().from(invoices),
  ]);

  // Receivables (Unpaid Invoices)
  const totalReceivables = invoicesResult
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  
  const unpaidInvoicesCount = invoicesResult
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .length;
  
  const overdueInvoicesCount = invoicesResult
    .filter(inv => inv.status === 'overdue')
    .length;

  const overdueInvoicesAmount = invoicesResult
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

  // Payables (Placeholder if needed)
  const totalPayables = 0; 
  const overdueBillsCount = 0;
  const overdueBillsAmount = 0;

  const [labourResult, expensesResult, incomeResult] = await Promise.all([
     db.select({ total: sum(labourEntries.totalCost) }).from(labourEntries),
     db.select({ total: sum(expenses.amount) }).from(expenses),
     db.select({ total: sum(invoices.totalAmount) }).from(invoices),
  ]);

  const totalExpensesValue = Number(labourResult[0].total || 0) + Number(expensesResult[0].total || 0);
  const totalIncomeValue = Number(incomeResult[0].total || 0);

  return {
    activeProjects,
    workersToday: workersTodayCount,
    totalReceivables,
    totalPayables,
    unpaidInvoicesCount,
    overdueInvoicesCount,
    overdueBillsCount,
    overdueInvoicesAmount,
    overdueBillsAmount,
    totalIncome: totalIncomeValue,
    totalExpenses: totalExpensesValue,
    pendingPayments: totalReceivables,
  };
}

function shortenTemplateName(name: string) {
  const mapping: Record<string, string> = {
    "AK Enterprises": "AKE",
    "Vedant Enterprises": "VED",
    "Atique Khan": "ATK",
    "K.G.N. Enterprises": "KGN",
    "Anas Khan Merchant": "AKM",
    "Energy Security": "ESG",
    "Vijay Enterprises": "VIJ",
    "General/Unassigned": "GEN"
  };
  if (mapping[name]) return mapping[name];
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
}

export async function getQuotationPipeline() {
  const result = await db.select({
    status: quotations.status,
    count: count(),
    total: sum(quotations.totalAmount)
  }).from(quotations)
    .groupBy(quotations.status);

  return result.map(r => ({
    status: r.status,
    count: Number(r.count),
    total: Number(r.total || 0)
  }));
}

export async function getSiteAttendanceSummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateStr = today.toISOString().split('T')[0];

  const result = await db.select({
    projectId: labourEntries.projectId,
    projectName: projects.name,
    workerCount: sum(labourEntries.workersCount),
  })
    .from(labourEntries)
    .leftJoin(projects, eq(labourEntries.projectId, projects.id))
    .where(eq(labourEntries.date, dateStr))
    .groupBy(labourEntries.projectId, projects.name);

  return result.map(r => ({
    id: r.projectId,
    name: r.projectName || "Unknown Project",
    count: Number(r.workerCount || 0)
  }));
}

export async function getLatestScrapEntries() {
  return db.select({
    id: scrapEntries.id,
    projectName: projects.name,
    type: scrapEntries.type,
    amount: scrapEntries.amount,
    weight: scrapEntries.weight,
    date: scrapEntries.date
  })
    .from(scrapEntries)
    .leftJoin(projects, eq(scrapEntries.projectId, projects.id))
    .orderBy(desc(scrapEntries.date))
    .limit(5);
}

export async function getProjectDistribution() {
  const result = await db.select({
    workType: projects.workType,
    count: count()
  }).from(projects)
    .where(eq(projects.status, 'active'))
    .groupBy(projects.workType);

  return result.map(r => ({
    type: r.workType || "Other",
    count: Number(r.count)
  }));
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
  const [allExpenses, labourResult] = await Promise.all([
    db.select().from(expenses),
    db.select({ total: sum(labourEntries.totalCost) }).from(labourEntries),
  ]);

  const labourAmount = Number(labourResult[0].total || 0);
  
  // Standard categories from the entry form + Labor
  const standardCategories = [
    "Labor",
    "Material",
    "Transport",
    "Tools & Equipment",
    "Food & Refreshment",
    "Miscellaneous"
  ];

  const typeMap = new Map<string, number>();
  
  // Initialize with 0 to ensure legend is always full
  standardCategories.forEach(cat => typeMap.set(cat, 0));

  // Populate actual data
  allExpenses.forEach(exp => {
    const type = exp.type || "Miscellaneous";
    typeMap.set(type, (typeMap.get(type) || 0) + Number(exp.amount || 0));
  });

  // Add Labor
  typeMap.set("Labor", (typeMap.get("Labor") || 0) + labourAmount);

  const total = Array.from(typeMap.values()).reduce((a, b) => a + b, 0);

  const breakdown = Array.from(typeMap.entries()).map(([name, amount]) => ({
    name,
    amount,
    percentage: total > 0 ? (amount / total) * 100 : 0
  })).sort((a, b) => {
    // Sort by amount, then preserve order for 0s
    if (b.amount !== a.amount) return b.amount - a.amount;
    return standardCategories.indexOf(a.name) - standardCategories.indexOf(b.name);
  });

  return breakdown.slice(0, 6);
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

  return result.map(inv => ({
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

  const invoiceTotal = allInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const quotationTotal = allQuotations.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

  // Group by template
  let templateStats = templates.map(t => {
    const templateInvoices = allInvoices.filter(inv => inv.templateId === t.id);
    const templateQuotes = allQuotations.filter(q => q.templateId === t.id);
    
    return {
      name: t.name,
      shortName: shortenTemplateName(t.name),
      invoices: {
        count: templateInvoices.length,
        value: templateInvoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0)
      },
      quotations: {
        count: templateQuotes.length,
        value: templateQuotes.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0)
      }
    };
  });

  // Filter only those that have BOTH
  templateStats = templateStats.filter(s => s.invoices.count > 0 && s.quotations.count > 0);

  // Handle unassigned (null templateId)
  const unassignedInvoices = allInvoices.filter(inv => !inv.templateId);
  const unassignedQuotes = allQuotations.filter(q => !q.templateId);

  if (unassignedInvoices.length > 0 && unassignedQuotes.length > 0) {
    templateStats.push({
      name: "General/Unassigned",
      shortName: "GEN",
      invoices: {
        count: unassignedInvoices.length,
        value: unassignedInvoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0)
      },
      quotations: {
        count: unassignedQuotes.length,
        value: unassignedQuotes.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0)
      }
    });
  }

  return {
    invoices: {
      count: allInvoices.length,
      value: invoiceTotal,
    },
    quotations: {
      count: allQuotations.length,
      value: quotationTotal,
    },
    templateStats
  };
}

export async function getRecentInwardPayments() {
  const result = await db.select({
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

  return result;
}

export async function getMonthlyExpenseChart() {
  // Get general expenses grouped by month
  const expenseResult = await db.select({
    month: sql<string>`TO_CHAR(${expenses.date}::date, 'Mon')`,
    amount: sql<number>`sum(${expenses.amount})`,
  }).from(expenses)
    .groupBy(sql`TO_CHAR(${expenses.date}::date, 'Mon')`);

  // Get labour costs grouped by month
  const labourResult = await db.select({
    month: sql<string>`TO_CHAR(${labourEntries.date}::date, 'Mon')`,
    amount: sql<number>`sum(${labourEntries.totalCost})`,
  }).from(labourEntries)
    .groupBy(sql`TO_CHAR(${labourEntries.date}::date, 'Mon')`);

  // Get income (invoices) grouped by month
  const incomeResult = await db.select({
    month: sql<string>`TO_CHAR(${invoices.createdAt}::date, 'Mon')`,
    income: sql<number>`sum(${invoices.totalAmount})`,
  }).from(invoices)
    .groupBy(sql`TO_CHAR(${invoices.createdAt}::date, 'Mon')`);

  // Combine results
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return months.map(m => {
    const exp = expenseResult.find(r => r.month === m);
    const lab = labourResult.find(r => r.month === m);
    const inc = incomeResult.find(r => r.month === m);
    
    const totalExp = Number(exp?.amount || 0) + Number(lab?.amount || 0);

    return {
      month: m,
      expense: totalExp,
      income: Number(inc?.income || 0)
    };
  });
}

export async function getTopClients() {
  const result = await db.select({
    id: clients.id,
    name: clients.name,
    amount: sum(invoices.totalAmount),
  })
    .from(clients)
    .innerJoin(invoices, eq(clients.id, invoices.clientId))
    .groupBy(clients.id, clients.name)
    .orderBy(desc(sql`sum(${invoices.totalAmount})`))
    .limit(3);

  return result.map(r => ({
    ...r,
    amount: Number(r.amount || 0)
  }));
}
