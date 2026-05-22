"use client";

import { useRouter } from "next/navigation";
import { DocumentForm, DocumentFormValues } from "@/components/document/DocumentForm";
import { updateInvoice } from "@/app/actions/invoices";
import { generateId } from "@/lib/utils";

type Invoice = {
  id: number;
  templateId: number | null;
  clientName: string | null;
  clientBranch: string | null;
  invoiceNumber: string;
  invoiceDate: string | null;
  dueDate: string | null;
  subject: string | null;
  notes: string | null;
  accountBankName: string | null;
  accountNumber: string | null;
  accountIfsc: string | null;
  accountHolder: string | null;
  accountPan: string | null;
  showTotal: boolean;
  createdAt: Date;
  items: { description: string; quantity: number; rate: number; taxed: string | null; amount: number }[];
};

interface Props {
  invoice: Invoice;
}

export default function EditInvoiceClient({ invoice }: Props) {
  const router = useRouter();

  const initialValues = {
    templateId: invoice.templateId,
    clientName: invoice.clientName || "",
    clientBranch: invoice.clientBranch || "",
    docNumber: invoice.invoiceNumber || "",
    date: invoice.invoiceDate || new Date(invoice.createdAt).toISOString().split("T")[0],
    expiryDate: invoice.dueDate || "",
    subject: invoice.subject || "",
    notes: invoice.notes || "",
    terms: invoice.notes || "",
    accountBankName: invoice.accountBankName || "",
    accountNumber: invoice.accountNumber || "",
    accountIfsc: invoice.accountIfsc || "",
    accountHolder: invoice.accountHolder || "",
    accountPan: invoice.accountPan || "",
    showTotal: invoice.showTotal,
    items: invoice.items.map((i) => ({
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

    await updateInvoice(
      invoice.id,
      {
        templateId: values.templateId,
        clientId: client.id,
        invoiceNumber: values.docNumber || undefined,
        clientBranch: values.clientBranch || null,
        subject: values.subject || null,
        notes: values.terms || values.notes || null,
        invoiceDate: values.date || undefined,
        dueDate: values.expiryDate || null,
        accountBankName: values.accountBankName || null,
        accountNumber: values.accountNumber || null,
        accountIfsc: values.accountIfsc || null,
        accountHolder: values.accountHolder || null,
        accountPan: values.accountPan || null,
        status: values.status,
        showTotal: values.showTotal,
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
    router.push(`/invoices/${invoice.id}`);
  }

  return (
    <DocumentForm
      mode="invoice"
      initialValues={initialValues}
      isEdit={true}
      onSave={handleSave}
      backHref={`/invoices/${invoice.id}`}
      backLabel="Back to Invoice"
    />
  );
}
