"use client";

import { useRouter } from "next/navigation";
import { DocumentForm, DocumentFormValues } from "@/components/document/DocumentForm";
import { updateSalesOrder } from "@/app/actions/sales-orders";
import { generateId } from "@/lib/utils";

type SalesOrderData = {
  id: number;
  templateId: number | null;
  clientName: string | null;
  clientBranch: string | null;
  orderNumber: string;
  orderDate: string | null;
  subject: string | null;
  notes: string | null;
  placeOfSupply: string | null;
  status: string;
  showTotal: boolean;
  createdAt: Date;
  items: { description: string; quantity: number; rate: number; taxed: string | null; amount: number }[];
};

interface Props {
  salesOrder: SalesOrderData;
}

export default function EditSalesOrderClient({ salesOrder }: Props) {
  const router = useRouter();

  const initialValues = {
    templateId: salesOrder.templateId,
    clientName: salesOrder.clientName || "",
    clientBranch: salesOrder.clientBranch || "",
    docNumber: salesOrder.orderNumber || "",
    date: salesOrder.orderDate || new Date(salesOrder.createdAt).toISOString().split("T")[0],
    expiryDate: "",
    subject: salesOrder.subject || "",
    notes: salesOrder.notes || "",
    terms: salesOrder.notes || "",
    placeOfSupply: salesOrder.placeOfSupply || "Maharashtra (27)",
    status: salesOrder.status,
    showTotal: salesOrder.showTotal,
    items: salesOrder.items.map((i) => ({
      id: generateId(),
      description: i.description,
      qty: i.quantity,
      rate: i.rate,
      hsn: i.taxed || "",
      amount: i.amount,
    })),
  };

  async function handleSave(values: DocumentFormValues, subtotal: number) {
    const { createClient, getClients, ensureBranchExists } = await import("@/app/actions/clients");
    const allClients = await getClients();
    let client = allClients.find((c) => c.name.toLowerCase() === values.clientName.toLowerCase());
    if (!client) {
      client = await createClient({ name: values.clientName, contactPerson: null, phone: null, email: null, address: null });
    }
    if (client && values.clientBranch) {
      await ensureBranchExists(client.id, values.clientBranch);
    }

    await updateSalesOrder(
      salesOrder.id,
      {
        templateId: values.templateId,
        clientId: client.id,
        orderNumber: values.docNumber || undefined,
        clientBranch: values.clientBranch || null,
        subject: values.subject || null,
        notes: values.terms || values.notes || null,
        placeOfSupply: values.placeOfSupply || null,
        orderDate: values.date,
        status: values.status,
        showTotal: values.showTotal,
      },
      values.items
        .filter((i) => i.description || i.amount > 0)
        .map((i) => ({ description: i.description, quantity: i.qty, rate: i.rate, taxed: i.hsn || null, amount: i.amount })),
    );
    router.push(`/sales-orders/${salesOrder.id}`);
  }

  return (
    <DocumentForm
      mode="sales_order"
      initialValues={initialValues}
      isEdit={true}
      onSave={handleSave}
      backHref={`/sales-orders/${salesOrder.id}`}
      backLabel="Back to Sales Order"
    />
  );
}
