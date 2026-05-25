"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { DocumentForm, DocumentFormValues } from "@/components/document/DocumentForm";
import { createCreditNote } from "@/app/actions/credit-notes";
import { Suspense } from "react";

function Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTemplateId = searchParams.get("template") ? Number(searchParams.get("template")) : null;

  async function handleSave(values: DocumentFormValues, subtotal: number) {
    const { createClient, getClients, ensureBranchExists } = await import("@/app/actions/clients");
    const allClients = await getClients();
    let client = allClients.find((c) => c.name.toLowerCase() === values.clientName.toLowerCase());
    if (!client) client = await createClient({ name: values.clientName, contactPerson: null, phone: null, email: null, address: null });
    if (client && values.clientBranch) await ensureBranchExists(client.id, values.clientBranch);

    const cn = await createCreditNote(
      { creditNoteNumber: values.docNumber || undefined, templateId: values.templateId, clientId: client.id, subject: values.subject || null, clientBranch: values.clientBranch || null, totalAmount: subtotal, status: values.status || "issued", notes: values.terms || null, placeOfSupply: values.placeOfSupply || null, creditNoteDate: values.date, showTotal: values.showTotal },
      values.items.filter((i) => i.description || i.amount > 0).map((i) => ({ description: i.description, quantity: i.qty, rate: i.rate, taxed: i.hsn || null, amount: i.amount })),
    );
    router.push(`/credit-notes/${cn.id}`);
  }

  return <DocumentForm mode="credit_note" initialValues={{ templateId: preselectedTemplateId }} onSave={handleSave} backHref="/credit-notes" backLabel="Back to Credit Notes" />;
}

export default function NewCreditNotePage() {
  return <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}><Content /></Suspense>;
}
