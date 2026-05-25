"use server";

import { db } from "@/app/db";
import {
  salesOrders,
  salesOrderItems,
  quotationTemplates,
  clients,
  clientBranches,
  projects,
  type NewSalesOrder,
  type NewSalesOrderItem,
} from "@/app/db/schema";
import { eq, desc, and, sql, inArray, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { getNextDocumentNumber } from "./quotations";

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getSalesOrders(options?: {
  templateId?: number;
  status?: string;
  page?: number;
  limit?: number;
  statuses?: string[];
  all?: boolean;
}) {
  const templateId = options?.templateId;
  const status = options?.status;
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 25;
  const offset = (page - 1) * limit;
  const statuses = options?.statuses;
  const all = options?.all ?? false;

  const conditions = [];
  if (templateId) {
    conditions.push(eq(salesOrders.templateId, templateId));
  }
  if (status && status !== "all") {
    conditions.push(eq(salesOrders.status, status.toLowerCase()));
  }
  if (statuses && statuses.length > 0) {
    conditions.push(inArray(salesOrders.status, statuses.map(s => s.toLowerCase())));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const query = db
    .select({
      id: salesOrders.id,
      templateId: salesOrders.templateId,
      templateName: quotationTemplates.name,
      clientId: salesOrders.clientId,
      clientName: clients.name,
      orderNumber: salesOrders.orderNumber,
      subject: salesOrders.subject,
      clientBranch: salesOrders.clientBranch,
      totalAmount: salesOrders.totalAmount,
      status: salesOrders.status,
      notes: salesOrders.notes,
      placeOfSupply: salesOrders.placeOfSupply,
      orderDate: salesOrders.orderDate,
      expectedDeliveryDate: salesOrders.expectedDeliveryDate,
      showTotal: salesOrders.showTotal,
      createdAt: salesOrders.createdAt,
    })
    .from(salesOrders)
    .leftJoin(clients, eq(salesOrders.clientId, clients.id))
    .leftJoin(quotationTemplates, eq(salesOrders.templateId, quotationTemplates.id));

  if (whereClause) {
    query.where(whereClause);
  }

  query.orderBy(desc(salesOrders.createdAt));

  if (all) {
    const data = await query;
    return {
      data,
      totalCount: data.length,
    };
  }

  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(salesOrders);

  if (whereClause) {
    countQuery.where(whereClause);
  }

  const [data, [{ count: totalCount }]] = await Promise.all([
    query.limit(limit).offset(offset),
    countQuery,
  ]);

  return {
    data,
    totalCount: Number(totalCount),
  };
}

export async function getSalesOrder(id: number) {
  const [rows, items, allTemplates] = await Promise.all([
    db
      .select({
        id: salesOrders.id,
        templateId: salesOrders.templateId,
        clientId: salesOrders.clientId,
        clientName: clients.name,
        clientPhone: clients.phone,
        clientEmail: clients.email,
        clientAddress: clients.address,
        clientGstin: clients.gstin,
        orderNumber: salesOrders.orderNumber,
        subject: salesOrders.subject,
        clientBranch: salesOrders.clientBranch,
        totalAmount: salesOrders.totalAmount,
        status: salesOrders.status,
        notes: salesOrders.notes,
        placeOfSupply: salesOrders.placeOfSupply,
        orderDate: salesOrders.orderDate,
        expectedDeliveryDate: salesOrders.expectedDeliveryDate,
        showTotal: salesOrders.showTotal,
        createdAt: salesOrders.createdAt,
      })
      .from(salesOrders)
      .leftJoin(clients, eq(salesOrders.clientId, clients.id))
      .where(eq(salesOrders.id, id)),
    db.select().from(salesOrderItems).where(eq(salesOrderItems.salesOrderId, id)),
    db.select().from(quotationTemplates),
  ]);

  const row = rows[0];
  if (!row) return null;

  const template = row.templateId
    ? allTemplates.find((t) => t.id === row.templateId) ?? null
    : null;

  let resolvedGstin = row.clientGstin || null;
  if (row.clientBranch && row.clientId) {
    const branchName = row.clientBranch.split("\n")[0].trim();
    const branchRows = await db
      .select({ gstin: clientBranches.gstin })
      .from(clientBranches)
      .where(
        and(
          eq(clientBranches.clientId, row.clientId),
          sql`lower(${clientBranches.branchName}) = ${branchName.toLowerCase()}`
        )
      )
      .limit(1);
    if (branchRows[0]?.gstin) {
      resolvedGstin = branchRows[0].gstin;
    }
  }

  return { ...row, clientGstin: resolvedGstin, items, template };
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createSalesOrder(
  data: Omit<NewSalesOrder, "orderNumber"> & { orderNumber?: string },
  items: Omit<NewSalesOrderItem, "salesOrderId">[],
) {
  await requireAuth();
  const finalOrderNumber =
    data.orderNumber || (await getNextDocumentNumber(data.templateId ?? null, "sales_order"));
  const totalAmount = data.totalAmount || items.reduce((sum, item) => sum + item.amount, 0);

  const [salesOrder] = await db
    .insert(salesOrders)
    .values({
      ...data,
      templateId: data.templateId as number | null,
      orderNumber: finalOrderNumber,
      totalAmount,
      orderDate: data.orderDate || new Date().toISOString().split("T")[0],
      notes: data.notes,
      showTotal: data.showTotal ?? true,
    })
    .returning();

  if (items.length > 0) {
    await db
      .insert(salesOrderItems)
      .values(items.map((item) => ({ ...item, salesOrderId: salesOrder.id })));
  }

  revalidatePath("/sales-orders");
  return salesOrder;
}

export async function updateSalesOrder(
  id: number,
  data: Partial<NewSalesOrder>,
  items?: Omit<NewSalesOrderItem, "salesOrderId">[],
) {
  await requireAuth();

  if (items !== undefined) {
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

    await Promise.all([
      db.update(salesOrders).set({ ...data, totalAmount }).where(eq(salesOrders.id, id)),
      db.delete(salesOrderItems).where(eq(salesOrderItems.salesOrderId, id)),
    ]);

    if (items.length > 0) {
      await db
        .insert(salesOrderItems)
        .values(items.map((item) => ({ ...item, salesOrderId: id })));
    }
  } else {
    await db.update(salesOrders).set(data).where(eq(salesOrders.id, id));
  }

  revalidatePath("/sales-orders");
  revalidatePath(`/sales-orders/${id}`);
}

export async function updateSalesOrderStatus(id: number, status: string) {
  await requireAuth();
  const [row] = await db
    .update(salesOrders)
    .set({ status })
    .where(eq(salesOrders.id, id))
    .returning();
  revalidatePath("/sales-orders");
  return row;
}

export async function deleteSalesOrder(id: number) {
  await requireAuth();
  try {
    await db.delete(salesOrders).where(eq(salesOrders.id, id));
    revalidatePath("/sales-orders");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete sales order. Please try again." };
  }
}

export async function cloneSalesOrder(id: number) {
  await requireAuth();

  let original = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      original = await getSalesOrder(id);
      break;
    } catch (err: any) {
      const isTimeout =
        err?.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
        err?.message?.includes("fetch failed") ||
        err?.message?.includes("Connect Timeout");
      if (isTimeout && attempt < 3) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }
      throw new Error(`Failed to fetch sales order: ${err?.message ?? "Connection timeout"}`);
    }
  }

  if (!original) throw new Error("Sales order not found");

  return createSalesOrder(
    {
      templateId: original.templateId,
      clientId: original.clientId,
      subject: original.subject ? `${original.subject} (Copy)` : null,
      clientBranch: original.clientBranch,
      totalAmount: original.totalAmount,
      status: "draft",
      notes: original.notes,
      placeOfSupply: original.placeOfSupply,
      orderDate: original.orderDate,
      expectedDeliveryDate: original.expectedDeliveryDate,
      showTotal: original.showTotal,
    },
    original.items.map(({ description, quantity, rate, taxed, amount }) => ({
      description,
      quantity,
      rate,
      taxed,
      amount,
    })),
  );
}
