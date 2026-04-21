"use client";

import { useRouter } from "next/navigation";
import { DocumentForm, DocumentFormValues } from "@/components/document/DocumentForm";
import { updateQuotation } from "@/app/actions/quotations";
import { generateId } from "@/lib/utils";

type Quotation = {
  id: number;
  templateId: number | null;
  clientName: string | null;
  clientBranch: string | null;
  quotationNumber: string;
  quotationDate: string | null;
  subject: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  items: { description: string; quantity: number; rate: number; taxed: string | null; amount: number }[];
};

interface Props {
  quotation: Quotation;
}

export default function EditQuotationClient({ quotation }: Props) {
  const router = useRouter();

  const initialValues = {
    templateId: quotation.templateId,
    clientName: quotation.clientName || "",
    clientBranch: quotation.clientBranch || "",
    docNumber: quotation.quotationNumber || "",
    date: quotation.quotationDate || new Date(quotation.createdAt).toISOString().split("T")[0],
    expiryDate: "",
    subject: quotation.subject || "",
    notes: quotation.notes || "",
    terms: quotation.notes || "",
    status: quotation.status,
    items: quotation.items.map((i) => ({
      id: generateId(),
      description: i.description,
      qty: i.quantity,
      rate: i.rate,
      hsn: i.taxed || "",
      amount: i.amount,
    })),
  };

  async function handleSave(values: DocumentFormValues, subtotal: number) {
    const { createClient, getClients } = await import("@/app/actions/clients");
    const allClients = await getClients();
    let client = allClients.find((c) => c.name.toLowerCase() === values.clientName.toLowerCase());
    if (!client) {
      client = await createClient({ name: values.clientName, contactPerson: null, phone: null, email: null, address: null });
    }

    await updateQuotation(
      quotation.id,
      {
        templateId: values.templateId,
        clientId: client.id,
        quotationNumber: values.docNumber || undefined,
        clientBranch: values.clientBranch || null,
        subject: values.subject || null,
        notes: values.terms || values.notes || null,
        quotationDate: values.date,
        status: values.status,
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
    router.push(`/quotations/${quotation.id}`);
  }

  return (
    <DocumentForm
      mode="quotation"
      initialValues={initialValues}
      isEdit={true}
      onSave={handleSave}
      backHref={`/quotations/${quotation.id}`}
      backLabel="Back to Quotation"
    />
  );
}
