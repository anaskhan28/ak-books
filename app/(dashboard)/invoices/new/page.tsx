"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  DocumentForm,
  DocumentFormValues,
} from "@/components/document/DocumentForm";
import { createInvoice } from "@/app/actions/invoices";
import { Suspense } from "react";

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("template");
  const preselectedTemplateId = templateIdParam
    ? Number(templateIdParam)
    : null;

  async function handleSave(values: DocumentFormValues, subtotal: number) {
    const { createClient, getClients } = await import("@/app/actions/clients");
    const allClients = await getClients();
    const matchedClient = allClients.find(
      (c) => c.name.toLowerCase() === values.clientName.toLowerCase(),
    );
    let clientId = matchedClient?.id;
    if (!clientId) {
      const newClient = await createClient({
        name: values.clientName,
        contactPerson: null,
        phone: null,
        email: null,
        address: null,
      });
      clientId = newClient.id;
    }

    const result = await createInvoice(
      {
        invoiceNumber: values.docNumber || undefined,
        templateId: values.templateId,
        clientId,
        subject: values.subject || null,
        clientBranch: values.clientBranch || null,
        invoiceDate: values.date,
        totalAmount: subtotal,
        status: values.status || "unpaid",
        notes: values.terms || values.notes || null,
        accountBankName: values.accountBankName || null,
        accountNumber: values.accountNumber || null,
        accountIfsc: values.accountIfsc || null,
        accountHolder: values.accountHolder || null,
        accountPan: values.accountPan || null,
      },
      values.items
        .filter((i) => i.description || i.amount > 0)
        .map((i) => ({
          description: i.description,
          quantity: i.qty,
          rate: i.rate,
          taxed: i.hsn || null,
          amount: i.amount,
        })),
    );

    if (result.success && result.invoice) {
      router.push(`/invoices/${result.invoice.id}`);
    } else {
      const { alerts } = await import("@/lib/alerts");
      alerts.error("Save failed", result.error);
    }
  }

  return (
    <DocumentForm
      mode="invoice"
      initialValues={{ templateId: preselectedTemplateId }}
      onSave={handleSave}
      backHref="/invoices"
      backLabel="Back to Invoices"
    />
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}>
      <NewInvoiceContent />
    </Suspense>
  );
}
