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
  salesOrders,
  salesOrderItems,
  deliveryChallans,
  deliveryChallanItems,
  ewayBills,
  ewayBillItems,
  creditNotes,
  creditNoteItems,
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

export const salesOrderRelations = relations(salesOrders, ({ one, many }) => ({
  template: one(quotationTemplates, {
    fields: [salesOrders.templateId],
    references: [quotationTemplates.id],
  }),
  client: one(clients, {
    fields: [salesOrders.clientId],
    references: [clients.id],
  }),
  quotation: one(quotations, {
    fields: [salesOrders.quotationId],
    references: [quotations.id],
  }),
  items: many(salesOrderItems),
  deliveryChallans: many(deliveryChallans),
}));

export const salesOrderItemRelations = relations(salesOrderItems, ({ one }) => ({
  salesOrder: one(salesOrders, {
    fields: [salesOrderItems.salesOrderId],
    references: [salesOrders.id],
  }),
}));

export const deliveryChallanRelations = relations(deliveryChallans, ({ one, many }) => ({
  template: one(quotationTemplates, {
    fields: [deliveryChallans.templateId],
    references: [quotationTemplates.id],
  }),
  client: one(clients, {
    fields: [deliveryChallans.clientId],
    references: [clients.id],
  }),
  salesOrder: one(salesOrders, {
    fields: [deliveryChallans.salesOrderId],
    references: [salesOrders.id],
  }),
  items: many(deliveryChallanItems),
  ewayBills: many(ewayBills),
}));

export const deliveryChallanItemRelations = relations(deliveryChallanItems, ({ one }) => ({
  deliveryChallan: one(deliveryChallans, {
    fields: [deliveryChallanItems.deliveryChallanId],
    references: [deliveryChallans.id],
  }),
}));

export const ewayBillRelations = relations(ewayBills, ({ one, many }) => ({
  template: one(quotationTemplates, {
    fields: [ewayBills.templateId],
    references: [quotationTemplates.id],
  }),
  client: one(clients, {
    fields: [ewayBills.clientId],
    references: [clients.id],
  }),
  invoice: one(invoices, {
    fields: [ewayBills.invoiceId],
    references: [invoices.id],
  }),
  deliveryChallan: one(deliveryChallans, {
    fields: [ewayBills.deliveryChallanId],
    references: [deliveryChallans.id],
  }),
  items: many(ewayBillItems),
}));

export const ewayBillItemRelations = relations(ewayBillItems, ({ one }) => ({
  ewayBill: one(ewayBills, {
    fields: [ewayBillItems.ewayBillId],
    references: [ewayBills.id],
  }),
}));

export const creditNoteRelations = relations(creditNotes, ({ one, many }) => ({
  template: one(quotationTemplates, {
    fields: [creditNotes.templateId],
    references: [quotationTemplates.id],
  }),
  client: one(clients, {
    fields: [creditNotes.clientId],
    references: [clients.id],
  }),
  invoice: one(invoices, {
    fields: [creditNotes.invoiceId],
    references: [invoices.id],
  }),
  items: many(creditNoteItems),
}));

export const creditNoteItemRelations = relations(creditNoteItems, ({ one }) => ({
  creditNote: one(creditNotes, {
    fields: [creditNoteItems.creditNoteId],
    references: [creditNotes.id],
  }),
}));

