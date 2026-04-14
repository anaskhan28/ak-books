"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DocumentForm, DocumentFormValues } from "@/components/document/DocumentForm";
import { getInvoice, updateInvoice } from "@/app/actions/invoices";
import { generateId } from "@/lib/utils";

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const [initialValues, setInitialValues] = useState<Partial<DocumentFormValues> | null>(null);

  useEffect(() => {
    async function load() {
      const dbInvoice = await getInvoice(Number(params.id));
      if (!dbInvoice) return router.push("/invoices");
      
      setInitialValues({
        templateId: dbInvoice.templateId,
        clientName: dbInvoice.clientName || "",
        clientBranch: dbInvoice.clientBranch || "",
        docNumber: dbInvoice.invoiceNumber || "",
        date: dbInvoice.invoiceDate || new Date(dbInvoice.createdAt).toISOString().split("T")[0],
        expiryDate: "",
        subject: dbInvoice.subject || "",
        notes: dbInvoice.notes || "",
        terms: dbInvoice.notes || "", // Load notes into terms for templates using that field
        accountBankName: dbInvoice.accountBankName || "",
        accountNumber: dbInvoice.accountNumber || "",
        accountIfsc: dbInvoice.accountIfsc || "",
        accountHolder: dbInvoice.accountHolder || "",
        accountPan: dbInvoice.accountPan || "",
        items: dbInvoice.items.map(i => ({
          id: generateId(),
          description: i.description,
          qty: i.quantity,
          rate: i.rate,
          hsn: i.taxed || "",
          amount: i.amount
        }))
      });
    }
    load();
  }, [params.id, router]);

  async function handleSave(values: DocumentFormValues, subtotal: number) {
    const { createClient, getClients } = await import("@/app/actions/clients");
    const allClients = await getClients();
    let client = allClients.find((c) => c.name.toLowerCase() === values.clientName.toLowerCase());
    if (!client) {
      client = await createClient({ name: values.clientName, contactPerson: null, phone: null, email: null, address: null });
    }

    await updateInvoice(
      Number(params.id),
      {
         templateId: values.templateId,
         clientId: client.id,
         invoiceNumber: values.docNumber || undefined,
         clientBranch: values.clientBranch || null,
         subject: values.subject || null,
         notes: values.terms || values.notes || null, // Map form terms back to DB notes
         invoiceDate: values.date || undefined,
         accountBankName: values.accountBankName || null,
         accountNumber: values.accountNumber || null,
         accountIfsc: values.accountIfsc || null,
         accountHolder: values.accountHolder || null,
         accountPan: values.accountPan || null,
         status: values.status,
      },
      values.items.filter((i) => i.description || i.amount > 0).map((i) => ({
         description: i.description,
         quantity: i.qty,
         rate: i.rate,
         taxed: i.hsn || null,
         amount: i.amount,
      }))
    );
    router.push(`/invoices/${params.id}`);
  }

  if (!initialValues) {
    return (
      <div className="flex pt-40 justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <DocumentForm
      mode="invoice"
      initialValues={initialValues}
      isEdit={true}
      onSave={handleSave}
      backHref={`/invoices/${params.id}`}
      backLabel="Back to Invoice"
    />
  );
}
