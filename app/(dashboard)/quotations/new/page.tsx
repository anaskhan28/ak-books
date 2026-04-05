"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  DocumentForm,
  DocumentFormValues,
} from "@/components/document/DocumentForm";
import { createQuotation } from "@/app/actions/quotations";

import { Suspense } from "react";

function NewQuotationContent() {
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

    const q = await createQuotation(
      {
        templateId: values.templateId,
        clientId,
        projectId: null,
        subject: values.subject || null,
        clientBranch: values.clientBranch || null,
        totalAmount: subtotal,
        status: "draft",
        notes: values.terms || null,
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

    router.push(`/quotations/${q.id}`);
  }

  return (
    <DocumentForm
      mode="quotation"
      initialValues={{ templateId: preselectedTemplateId }}
      onSave={handleSave}
      backHref="/quotations"
      backLabel="Back to Quotations"
    />
  );
}

export default function NewQuotationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}>
      <NewQuotationContent />
    </Suspense>
  );
}
