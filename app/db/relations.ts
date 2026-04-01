import { relations } from "drizzle-orm/relations";
import {
  organizationInNeonAuth,
  invitationInNeonAuth,
  userInNeonAuth,
  sessionInNeonAuth,
  accountInNeonAuth,
  memberInNeonAuth,
  clients,
  projects,
  labourEntries,
  expenses,
  scrapEntries,
  quotationTemplates,
  quotations,
  quotationItems,
  invoices,
  payments,
} from "./schema";

// ─── Neon Auth Relations ────────────────────────────────────────────────────

export const invitationInNeonAuthRelations = relations(
  invitationInNeonAuth,
  ({ one }) => ({
    organization: one(organizationInNeonAuth, {
      fields: [invitationInNeonAuth.organizationId],
      references: [organizationInNeonAuth.id],
    }),
    inviter: one(userInNeonAuth, {
      fields: [invitationInNeonAuth.inviterId],
      references: [userInNeonAuth.id],
    }),
  }),
);

export const organizationInNeonAuthRelations = relations(
  organizationInNeonAuth,
  ({ many }) => ({
    invitations: many(invitationInNeonAuth),
    members: many(memberInNeonAuth),
  }),
);

export const userInNeonAuthRelations = relations(
  userInNeonAuth,
  ({ many }) => ({
    invitations: many(invitationInNeonAuth),
    sessions: many(sessionInNeonAuth),
    accounts: many(accountInNeonAuth),
    members: many(memberInNeonAuth),
  }),
);

export const sessionInNeonAuthRelations = relations(
  sessionInNeonAuth,
  ({ one }) => ({
    user: one(userInNeonAuth, {
      fields: [sessionInNeonAuth.userId],
      references: [userInNeonAuth.id],
    }),
  }),
);

export const accountInNeonAuthRelations = relations(
  accountInNeonAuth,
  ({ one }) => ({
    user: one(userInNeonAuth, {
      fields: [accountInNeonAuth.userId],
      references: [userInNeonAuth.id],
    }),
  }),
);

export const memberInNeonAuthRelations = relations(
  memberInNeonAuth,
  ({ one }) => ({
    organization: one(organizationInNeonAuth, {
      fields: [memberInNeonAuth.organizationId],
      references: [organizationInNeonAuth.id],
    }),
    user: one(userInNeonAuth, {
      fields: [memberInNeonAuth.userId],
      references: [userInNeonAuth.id],
    }),
  }),
);

// ─── CRM Relations ─────────────────────────────────────────────────────────

export const clientRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
  quotations: many(quotations),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  labourEntries: many(labourEntries),
  expenses: many(expenses),
  scrapEntries: many(scrapEntries),
  quotations: many(quotations),
}));

export const labourEntryRelations = relations(labourEntries, ({ one }) => ({
  project: one(projects, {
    fields: [labourEntries.projectId],
    references: [projects.id],
  }),
}));

export const expenseRelations = relations(expenses, ({ one }) => ({
  project: one(projects, {
    fields: [expenses.projectId],
    references: [projects.id],
  }),
}));

export const scrapEntryRelations = relations(scrapEntries, ({ one }) => ({
  project: one(projects, {
    fields: [scrapEntries.projectId],
    references: [projects.id],
  }),
}));

export const quotationTemplateRelations = relations(
  quotationTemplates,
  ({ many }) => ({
    quotations: many(quotations),
  }),
);

export const quotationRelations = relations(quotations, ({ one, many }) => ({
  template: one(quotationTemplates, {
    fields: [quotations.templateId],
    references: [quotationTemplates.id],
  }),
  client: one(clients, {
    fields: [quotations.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [quotations.projectId],
    references: [projects.id],
  }),
  items: many(quotationItems),
  invoices: many(invoices),
}));

export const quotationItemRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id],
  }),
}));

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  quotation: one(quotations, {
    fields: [invoices.quotationId],
    references: [quotations.id],
  }),
  payments: many(payments),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));
