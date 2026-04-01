import {
  pgTable,
  pgSchema,
  serial,
  integer,
  index,
  foreignKey,
  uuid,
  text,
  timestamp,
  date,
  unique,
  boolean,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Neon Auth Schema (managed by Neon — do not modify) ─────────────────────

export const neonAuth = pgSchema("neon_auth");

export const userInNeonAuth = neonAuth.table(
  "user",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean().notNull(),
    image: text(),
    createdAt: timestamp({ withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    role: text(),
    banned: boolean(),
    banReason: text(),
    banExpires: timestamp({ withTimezone: true, mode: "string" }),
  },
  (table) => [unique("user_email_key").on(table.email)],
);

export const organizationInNeonAuth = neonAuth.table(
  "organization",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    logo: text(),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    metadata: text(),
  },
  (table) => [
    uniqueIndex("organization_slug_uidx").using(
      "btree",
      table.slug.asc().nullsLast().op("text_ops"),
    ),
    unique("organization_slug_key").on(table.slug),
  ],
);

export const invitationInNeonAuth = neonAuth.table(
  "invitation",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organizationId: uuid().notNull(),
    email: text().notNull(),
    role: text(),
    status: text().notNull(),
    expiresAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    inviterId: uuid().notNull(),
  },
  (table) => [
    index("invitation_email_idx").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops"),
    ),
    index("invitation_organizationId_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizationInNeonAuth.id],
      name: "invitation_organizationId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.inviterId],
      foreignColumns: [userInNeonAuth.id],
      name: "invitation_inviterId_fkey",
    }).onDelete("cascade"),
  ],
);

export const sessionInNeonAuth = neonAuth.table(
  "session",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    expiresAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    token: text().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: uuid().notNull(),
    impersonatedBy: text(),
    activeOrganizationId: text(),
  },
  (table) => [
    index("session_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userInNeonAuth.id],
      name: "session_userId_fkey",
    }).onDelete("cascade"),
    unique("session_token_key").on(table.token),
  ],
);

export const accountInNeonAuth = neonAuth.table(
  "account",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: uuid().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true, mode: "string" }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true, mode: "string" }),
    scope: text(),
    password: text(),
    createdAt: timestamp({ withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => [
    index("account_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userInNeonAuth.id],
      name: "account_userId_fkey",
    }).onDelete("cascade"),
  ],
);

export const verificationInNeonAuth = neonAuth.table(
  "verification",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("verification_identifier_idx").using(
      "btree",
      table.identifier.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const jwksInNeonAuth = neonAuth.table("jwks", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  publicKey: text().notNull(),
  privateKey: text().notNull(),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  expiresAt: timestamp({ withTimezone: true, mode: "string" }),
});

export const memberInNeonAuth = neonAuth.table(
  "member",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organizationId: uuid().notNull(),
    userId: uuid().notNull(),
    role: text().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => [
    index("member_organizationId_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("uuid_ops"),
    ),
    index("member_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizationInNeonAuth.id],
      name: "member_organizationId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userInNeonAuth.id],
      name: "member_userId_fkey",
    }).onDelete("cascade"),
  ],
);

export const projectConfigInNeonAuth = neonAuth.table(
  "project_config",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    endpointId: text("endpoint_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    trustedOrigins: jsonb("trusted_origins").notNull(),
    socialProviders: jsonb("social_providers").notNull(),
    emailProvider: jsonb("email_provider"),
    emailAndPassword: jsonb("email_and_password"),
    allowLocalhost: boolean("allow_localhost").notNull(),
    pluginConfigs: jsonb("plugin_configs"),
    webhookConfig: jsonb("webhook_config"),
  },
  (table) => [unique("project_config_endpoint_id_key").on(table.endpointId)],
);

// ─── AK Enterprise CRM Schema ──────────────────────────────────────────────

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clientId: integer("client_id").references(() => clients.id),
  workType: text("work_type").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status").notNull().default("planning"),
  description: text("description"),
  location: text("location"),
  quotedAmount: integer("quoted_amount").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export const workers = pgTable("workers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default("labourer"),
  phone: text("phone"),
  dailyRate: integer("daily_rate").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Worker = typeof workers.$inferSelect;
export type NewWorker = typeof workers.$inferInsert;

export const labourEntries = pgTable("labour_entries", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  workersCount: integer("workers_count").notNull().default(1),
  totalCost: integer("total_cost").notNull(),
  notes: text("notes"),
});
export type LabourEntry = typeof labourEntries.$inferSelect;
export type NewLabourEntry = typeof labourEntries.$inferInsert;

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(),
  date: date("date").notNull(),
});
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export const scrapEntries = pgTable("scrap_entries", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'purchase' or 'sale'
  description: text("description").notNull(),
  weight: text("weight"),
  amount: integer("amount").notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
});
export type ScrapEntry = typeof scrapEntries.$inferSelect;
export type NewScrapEntry = typeof scrapEntries.$inferInsert;

export const quotationTemplates = pgTable("quotation_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyName: text("company_name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  subjectPrefix: text("subject_prefix"),
  terms: text("terms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type QuotationTemplate = typeof quotationTemplates.$inferSelect;
export type NewQuotationTemplate = typeof quotationTemplates.$inferInsert;

export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => quotationTemplates.id),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id),
  quotationNumber: text("quotation_number").notNull().unique(),
  subject: text("subject"),
  clientBranch: text("client_branch"),
  totalAmount: integer("total_amount").notNull().default(0),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Quotation = typeof quotations.$inferSelect;
export type NewQuotation = typeof quotations.$inferInsert;

export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id")
    .notNull()
    .references(() => quotations.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  rate: integer("rate").notNull(),
  taxed: text("taxed"),
  amount: integer("amount").notNull(),
});
export type QuotationItem = typeof quotationItems.$inferSelect;
export type NewQuotationItem = typeof quotationItems.$inferInsert;

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id")
    .references(() => quotations.id),
  templateId: integer("template_id").references(() => quotationTemplates.id),
  clientId: integer("client_id").references(() => clients.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientBranch: text("client_branch"),
  subject: text("subject"),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("unpaid"),
  dueDate: date("due_date"),
  invoiceDate: text("invoice_date"),
  notes: text("notes"),
  accountBankName: text("account_bank_name"),
  accountNumber: text("account_number"),
  accountIfsc: text("account_ifsc"),
  accountHolder: text("account_holder"),
  accountPan: text("account_pan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  rate: integer("rate").notNull(),
  taxed: text("taxed"),
  amount: integer("amount").notNull(),
});
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  amount: integer("amount").notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: text("payment_method").notNull().default("bank_transfer"),
  referenceNumber: text("reference_number"),
  depositTo: text("deposit_to").default("petty_cash"),
  paymentReceivedOn: text("payment_received_on"),
  notes: text("notes"),
  TDSAmount: integer("tds_amount").notNull().default(0),

});
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
