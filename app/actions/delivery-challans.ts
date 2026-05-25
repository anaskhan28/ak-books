"use server";

import { db } from "@/app/db";
import {
  deliveryChallans,
  deliveryChallanItems,
  quotationTemplates,
  clients,
  clientBranches,
  type NewDeliveryChallan,
  type NewDeliveryChallanItem,
} from "@/app/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { getNextDocumentNumber } from "./quotations";

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getDeliveryChallans(options?: {
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
    conditions.push(eq(deliveryChallans.templateId, templateId));
  }
  if (status && status !== "all") {
    conditions.push(eq(deliveryChallans.status, status.toLowerCase()));
  }
  if (statuses && statuses.length > 0) {
    conditions.push(inArray(deliveryChallans.status, statuses.map(s => s.toLowerCase())));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const query = db
    .select({
      id: deliveryChallans.id,
      salesOrderId: deliveryChallans.salesOrderId,
      templateId: deliveryChallans.templateId,
      templateName: quotationTemplates.name,
      clientId: deliveryChallans.clientId,
      clientName: clients.name,
      challanNumber: deliveryChallans.challanNumber,
      subject: deliveryChallans.subject,
      clientBranch: deliveryChallans.clientBranch,
      totalAmount: deliveryChallans.totalAmount,
      status: deliveryChallans.status,
      notes: deliveryChallans.notes,
      placeOfSupply: deliveryChallans.placeOfSupply,
      challanDate: deliveryChallans.challanDate,
      dispatchDate: deliveryChallans.dispatchDate,
      transportMode: deliveryChallans.transportMode,
      vehicleNumber: deliveryChallans.vehicleNumber,
      showTotal: deliveryChallans.showTotal,
      createdAt: deliveryChallans.createdAt,
    })
    .from(deliveryChallans)
    .leftJoin(clients, eq(deliveryChallans.clientId, clients.id))
    .leftJoin(quotationTemplates, eq(deliveryChallans.templateId, quotationTemplates.id));

  if (whereClause) {
    query.where(whereClause);
  }

  query.orderBy(desc(deliveryChallans.createdAt));

  if (all) {
    const data = await query;
    return {
      data,
      totalCount: data.length,
    };
  }

  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(deliveryChallans);

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

export async function getDeliveryChallan(id: number) {
  const [rows, items, allTemplates] = await Promise.all([
    db
      .select({
        id: deliveryChallans.id,
        salesOrderId: deliveryChallans.salesOrderId,
        templateId: deliveryChallans.templateId,
        clientId: deliveryChallans.clientId,
        clientName: clients.name,
        clientPhone: clients.phone,
        clientEmail: clients.email,
        clientAddress: clients.address,
        clientGstin: clients.gstin,
        challanNumber: deliveryChallans.challanNumber,
        subject: deliveryChallans.subject,
        clientBranch: deliveryChallans.clientBranch,
        totalAmount: deliveryChallans.totalAmount,
        status: deliveryChallans.status,
        notes: deliveryChallans.notes,
        placeOfSupply: deliveryChallans.placeOfSupply,
        challanDate: deliveryChallans.challanDate,
        dispatchDate: deliveryChallans.dispatchDate,
        transportMode: deliveryChallans.transportMode,
        vehicleNumber: deliveryChallans.vehicleNumber,
        showTotal: deliveryChallans.showTotal,
        createdAt: deliveryChallans.createdAt,
      })
      .from(deliveryChallans)
      .leftJoin(clients, eq(deliveryChallans.clientId, clients.id))
      .where(eq(deliveryChallans.id, id)),
    db.select().from(deliveryChallanItems).where(eq(deliveryChallanItems.deliveryChallanId, id)),
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

export async function createDeliveryChallan(
  data: Omit<NewDeliveryChallan, "challanNumber"> & { challanNumber?: string },
  items: Omit<NewDeliveryChallanItem, "deliveryChallanId">[],
) {
  await requireAuth();
  const finalChallanNumber =
    data.challanNumber || (await getNextDocumentNumber(data.templateId ?? null, "delivery_challan"));
  const totalAmount = data.totalAmount || items.reduce((sum, item) => sum + item.amount, 0);

  const [deliveryChallan] = await db
    .insert(deliveryChallans)
    .values({
      ...data,
      templateId: data.templateId as number | null,
      challanNumber: finalChallanNumber,
      totalAmount,
      challanDate: data.challanDate || new Date().toISOString().split("T")[0],
      notes: data.notes,
      showTotal: data.showTotal ?? true,
    })
    .returning();

  if (items.length > 0) {
    await db
      .insert(deliveryChallanItems)
      .values(items.map((item) => ({ ...item, deliveryChallanId: deliveryChallan.id })));
  }

  revalidatePath("/delivery-challans");
  return deliveryChallan;
}

export async function updateDeliveryChallan(
  id: number,
  data: Partial<NewDeliveryChallan>,
  items?: Omit<NewDeliveryChallanItem, "deliveryChallanId">[],
) {
  await requireAuth();

  if (items !== undefined) {
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

    await Promise.all([
      db.update(deliveryChallans).set({ ...data, totalAmount }).where(eq(deliveryChallans.id, id)),
      db.delete(deliveryChallanItems).where(eq(deliveryChallanItems.deliveryChallanId, id)),
    ]);

    if (items.length > 0) {
      await db
        .insert(deliveryChallanItems)
        .values(items.map((item) => ({ ...item, deliveryChallanId: id })));
    }
  } else {
    await db.update(deliveryChallans).set(data).where(eq(deliveryChallans.id, id));
  }

  revalidatePath("/delivery-challans");
  revalidatePath(`/delivery-challans/${id}`);
}

export async function updateDeliveryChallanStatus(id: number, status: string) {
  await requireAuth();
  const [row] = await db
    .update(deliveryChallans)
    .set({ status })
    .where(eq(deliveryChallans.id, id))
    .returning();
  revalidatePath("/delivery-challans");
  return row;
}

export async function deleteDeliveryChallan(id: number) {
  await requireAuth();
  try {
    await db.delete(deliveryChallans).where(eq(deliveryChallans.id, id));
    revalidatePath("/delivery-challans");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete delivery challan. Please try again." };
  }
}

export async function cloneDeliveryChallan(id: number) {
  await requireAuth();

  let original = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      original = await getDeliveryChallan(id);
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
      throw new Error(`Failed to fetch delivery challan: ${err?.message ?? "Connection timeout"}`);
    }
  }

  if (!original) throw new Error("Delivery challan not found");

  return createDeliveryChallan(
    {
      salesOrderId: original.salesOrderId,
      templateId: original.templateId,
      clientId: original.clientId,
      subject: original.subject ? `${original.subject} (Copy)` : null,
      clientBranch: original.clientBranch,
      totalAmount: original.totalAmount,
      status: "draft",
      notes: original.notes,
      placeOfSupply: original.placeOfSupply,
      challanDate: original.challanDate,
      dispatchDate: original.dispatchDate,
      transportMode: original.transportMode,
      vehicleNumber: original.vehicleNumber,
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
