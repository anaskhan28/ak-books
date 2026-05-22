"use server";

import { db } from "@/app/db";
import {
  clients,
  clientBranches,
  type NewClient,
  type NewClientBranch,
} from "@/app/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";

import { validateGSTIN } from "@/lib/validation";

// ── Client Queries ───────────────────────────────────────────────────────────

export async function getClients() {
  return db.select().from(clients).orderBy(clients.name);
}

export async function getClient(id: number) {
  const rows = await db.select().from(clients).where(eq(clients.id, id));
  return rows[0] ?? null;
}

/** Get a client with all their branches */
export async function getClientWithBranches(id: number) {
  const [client, branches] = await Promise.all([
    db.select().from(clients).where(eq(clients.id, id)),
    db.select().from(clientBranches).where(eq(clientBranches.clientId, id)),
  ]);
  if (!client[0]) return null;
  return { ...client[0], branches };
}

// ── Client Mutations ─────────────────────────────────────────────────────────

export async function createClient(data: NewClient) {
  await requireAuth();

  // Validate GSTIN if provided
  if (data.gstin) {
    const result = validateGSTIN(data.gstin);
    if (!result.valid) throw new Error(result.error);
    data.gstin = data.gstin.trim().toUpperCase();
  }

  const rows = await db.insert(clients).values(data).returning();
  revalidatePath("/clients");
  revalidatePath("/");
  return rows[0];
}

export async function updateClient(id: number, data: Partial<NewClient>) {
  await requireAuth();

  // Validate GSTIN if being updated
  if (data.gstin !== undefined && data.gstin) {
    const result = validateGSTIN(data.gstin);
    if (!result.valid) throw new Error(result.error);
    data.gstin = data.gstin.trim().toUpperCase();
  }

  const rows = await db
    .update(clients)
    .set(data)
    .where(eq(clients.id, id))
    .returning();
  revalidatePath("/clients");
  return rows[0];
}

export async function deleteClient(id: number) {
  await requireAuth();
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/clients");
  revalidatePath("/");
}

// ── Branch Queries ───────────────────────────────────────────────────────────

export async function getBranches(clientId: number) {
  return db
    .select()
    .from(clientBranches)
    .where(eq(clientBranches.clientId, clientId))
    .orderBy(clientBranches.branchName);
}

export async function getAllBranches() {
  return db
    .select({
      id: clientBranches.id,
      clientId: clientBranches.clientId,
      clientName: clients.name,
      branchName: clientBranches.branchName,
      address: clientBranches.address,
      contactPerson: clientBranches.contactPerson,
      phone: clientBranches.phone,
      email: clientBranches.email,
      gstin: clientBranches.gstin,
    })
    .from(clientBranches)
    .leftJoin(clients, eq(clientBranches.clientId, clients.id))
    .orderBy(clients.name, clientBranches.branchName);
}

// ── Branch Mutations ─────────────────────────────────────────────────────────

export async function createBranch(data: NewClientBranch) {
  await requireAuth();
  const rows = await db.insert(clientBranches).values(data).returning();
  revalidatePath("/clients");
  return rows[0];
}

export async function updateBranch(id: number, data: Partial<NewClientBranch>) {
  await requireAuth();
  const rows = await db
    .update(clientBranches)
    .set(data)
    .where(eq(clientBranches.id, id))
    .returning();
  revalidatePath("/clients");
  return rows[0];
}

export async function deleteBranch(id: number) {
  await requireAuth();
  await db.delete(clientBranches).where(eq(clientBranches.id, id));
  revalidatePath("/clients");
}

export async function ensureBranchExists(clientId: number, branchText: string | null) {
  if (!branchText || !branchText.trim()) return null;
  const lines = branchText.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  
  const branchName = lines[0];
  
  // Extract GSTIN if present in subsequent lines
  let gstin: string | null = null;
  const addressLines = lines.slice(1).filter(line => {
    const gstMatch = line.match(/(?:GSTIN|GST|GST\s*No|GSTIN\s*No)?:?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/i);
    if (gstMatch) {
      gstin = gstMatch[1].toUpperCase();
      return false; // exclude from address field
    }
    return true;
  });
  
  const address = addressLines.join("\n") || null;
  
  const existing = await db
    .select()
    .from(clientBranches)
    .where(
      and(
        eq(clientBranches.clientId, clientId),
        sql`lower(${clientBranches.branchName}) = ${branchName.toLowerCase()}`
      )
    )
    .limit(1);
    
  if (existing.length > 0) {
    const updates: Partial<NewClientBranch> = {};
    if (address && existing[0].address !== address) {
      updates.address = address;
    }
    if (gstin && existing[0].gstin !== gstin) {
      updates.gstin = gstin;
    }
    if (Object.keys(updates).length > 0) {
      await db
        .update(clientBranches)
        .set(updates)
        .where(eq(clientBranches.id, existing[0].id));
    }
    return existing[0];
  }
  
  const [newBranch] = await db
    .insert(clientBranches)
    .values({
      clientId,
      branchName,
      address,
      gstin,
    })
    .returning();
    
  revalidatePath("/clients");
  return newBranch;
}
