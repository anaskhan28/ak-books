"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DocumentForm, DocumentFormValues } from "@/components/document/DocumentForm";
import { createSalesOrder } from "@/app/actions/sales-orders";
import { Suspense } from "react";

function NewSalesOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("template");
  const preselectedTemplateId = templateIdParam ? Number(templateIdParam) : null;

  async function handleSave(values: DocumentFormValues, subtotal: number) {
    const { createClient, getClients, ensureBranchExists } = await import("@/app/actions/clients");
    const allClients = await getClients();
    const matchedClient = allClients.find(
      (c) => c.name.toLowerCase() === values.clientName.toLowerCase(),
    );
    let clientId = matchedClient?.id;
    if (!clientId) {
      const newClient = await createClient({ name: values.clientName, contactPerson: null, phone: null, email: null, address: null });
      clientId = newClient.id;
    }
    if (clientId && values.clientBranch) {
      await ensureBranchExists(clientId, values.clientBranch);
    }

    const so = await createSalesOrder(
      {
        orderNumber: values.docNumber || undefined,
        templateId: values.templateId,
        clientId,
        subject: values.subject || null,
        clientBranch: values.clientBranch || null,
        totalAmount: subtotal,
        status: values.status || "draft",
        notes: values.terms || null,
        placeOfSupply: values.placeOfSupply || null,
        orderDate: values.date,
        showTotal: values.showTotal,
      },
      values.items
        .filter((i) => i.description || i.amount > 0)
        .map((i) => ({ description: i.description, quantity: i.qty, rate: i.rate, taxed: i.hsn || null, amount: i.amount })),
    );

    router.push(`/sales-orders/${so.id}`);
  }

  return (
    <DocumentForm
      mode="sales_order"
      initialValues={{ templateId: preselectedTemplateId }}
      onSave={handleSave}
      backHref="/sales-orders"
      backLabel="Back to Sales Orders"
    />
  );
}

export default function NewSalesOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}>
      <NewSalesOrderContent />
    </Suspense>
  );
}
