"use server";

import { db } from "@/app/db";
import {
  ewayBills,
  ewayBillItems,
  quotationTemplates,
  clients,
  clientBranches,
  type NewEwayBill,
  type NewEwayBillItem,
} from "@/app/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { getNextDocumentNumber } from "./quotations";

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getEwayBills(options?: {
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
    conditions.push(eq(ewayBills.templateId, templateId));
  }
  if (status && status !== "all") {
    conditions.push(eq(ewayBills.status, status.toLowerCase()));
  }
  if (statuses && statuses.length > 0) {
    conditions.push(inArray(ewayBills.status, statuses.map(s => s.toLowerCase())));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const query = db
    .select({
      id: ewayBills.id,
      invoiceId: ewayBills.invoiceId,
      deliveryChallanId: ewayBills.deliveryChallanId,
      templateId: ewayBills.templateId,
      templateName: quotationTemplates.name,
      clientId: ewayBills.clientId,
      clientName: clients.name,
      ewayBillNumber: ewayBills.ewayBillNumber,
      ewayBillDate: ewayBills.ewayBillDate,
      status: ewayBills.status,
      transporterName: ewayBills.transporterName,
      transporterId: ewayBills.transporterId,
      transportDocNumber: ewayBills.transportDocNumber,
      transportDocDate: ewayBills.transportDocDate,
      vehicleNumber: ewayBills.vehicleNumber,
      fromPlace: ewayBills.fromPlace,
      toPlace: ewayBills.toPlace,
      totalAmount: ewayBills.totalAmount,
      placeOfSupply: ewayBills.placeOfSupply,
      createdAt: ewayBills.createdAt,
    })
    .from(ewayBills)
    .leftJoin(clients, eq(ewayBills.clientId, clients.id))
    .leftJoin(quotationTemplates, eq(ewayBills.templateId, quotationTemplates.id));

  if (whereClause) {
    query.where(whereClause);
  }

  query.orderBy(desc(ewayBills.createdAt));

  if (all) {
    const data = await query;
    return { data, totalCount: data.length };
  }

  const countQuery = db.select({ count: sql<number>`count(*)` }).from(ewayBills);
  if (whereClause) countQuery.where(whereClause);

  const [data, [{ count: totalCount }]] = await Promise.all([
    query.limit(limit).offset(offset),
    countQuery,
  ]);

  return { data, totalCount: Number(totalCount) };
}

export async function getEwayBill(id: number) {
  const [rows, items, allTemplates] = await Promise.all([
    db
      .select({
        id: ewayBills.id,
        invoiceId: ewayBills.invoiceId,
        deliveryChallanId: ewayBills.deliveryChallanId,
        templateId: ewayBills.templateId,
        clientId: ewayBills.clientId,
        clientName: clients.name,
        clientPhone: clients.phone,
        clientEmail: clients.email,
        clientAddress: clients.address,
        clientGstin: clients.gstin,
        ewayBillNumber: ewayBills.ewayBillNumber,
        ewayBillDate: ewayBills.ewayBillDate,
        status: ewayBills.status,
        transporterName: ewayBills.transporterName,
        transporterId: ewayBills.transporterId,
        transportDocNumber: ewayBills.transportDocNumber,
        transportDocDate: ewayBills.transportDocDate,
        vehicleNumber: ewayBills.vehicleNumber,
        fromPlace: ewayBills.fromPlace,
        toPlace: ewayBills.toPlace,
        totalAmount: ewayBills.totalAmount,
        placeOfSupply: ewayBills.placeOfSupply,
        createdAt: ewayBills.createdAt,
      })
      .from(ewayBills)
      .leftJoin(clients, eq(ewayBills.clientId, clients.id))
      .where(eq(ewayBills.id, id)),
    db.select().from(ewayBillItems).where(eq(ewayBillItems.ewayBillId, id)),
    db.select().from(quotationTemplates),
  ]);

  const row = rows[0];
  if (!row) return null;

  const template = row.templateId
    ? allTemplates.find((t) => t.id === row.templateId) ?? null
    : null;

  let resolvedGstin = row.clientGstin || null;
  if (row.clientId) {
    // e-Way bills don't have clientBranch, but resolve from client
  }

  return { ...row, clientGstin: resolvedGstin, items, template };
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createEwayBill(
  data: Omit<NewEwayBill, "ewayBillNumber"> & { ewayBillNumber?: string },
  items: Omit<NewEwayBillItem, "ewayBillId">[],
) {
  await requireAuth();
  const finalNumber =
    data.ewayBillNumber || (await getNextDocumentNumber(data.templateId ?? null, "eway_bill"));
  const totalAmount = data.totalAmount || items.reduce((sum, item) => sum + item.amount, 0);

  const [ewayBill] = await db
    .insert(ewayBills)
    .values({
      ...data,
      templateId: data.templateId as number | null,
      ewayBillNumber: finalNumber,
      totalAmount,
      ewayBillDate: data.ewayBillDate || new Date().toISOString().split("T")[0],
    })
    .returning();

  if (items.length > 0) {
    await db
      .insert(ewayBillItems)
      .values(items.map((item) => ({ ...item, ewayBillId: ewayBill.id })));
  }

  revalidatePath("/eway-bills");
  return ewayBill;
}

export async function updateEwayBill(
  id: number,
  data: Partial<NewEwayBill>,
  items?: Omit<NewEwayBillItem, "ewayBillId">[],
) {
  await requireAuth();

  if (items !== undefined) {
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
    await Promise.all([
      db.update(ewayBills).set({ ...data, totalAmount }).where(eq(ewayBills.id, id)),
      db.delete(ewayBillItems).where(eq(ewayBillItems.ewayBillId, id)),
    ]);
    if (items.length > 0) {
      await db
        .insert(ewayBillItems)
        .values(items.map((item) => ({ ...item, ewayBillId: id })));
    }
  } else {
    await db.update(ewayBills).set(data).where(eq(ewayBills.id, id));
  }

  revalidatePath("/eway-bills");
  revalidatePath(`/eway-bills/${id}`);
}

export async function updateEwayBillStatus(id: number, status: string) {
  await requireAuth();
  const [row] = await db
    .update(ewayBills)
    .set({ status })
    .where(eq(ewayBills.id, id))
    .returning();
  revalidatePath("/eway-bills");
  return row;
}

export async function deleteEwayBill(id: number) {
  await requireAuth();
  try {
    await db.delete(ewayBills).where(eq(ewayBills.id, id));
    revalidatePath("/eway-bills");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete e-Way Bill. Please try again." };
  }
}
