"use client";
import { useRouter } from "next/navigation";
import { DocumentForm, DocumentFormValues } from "@/components/document/DocumentForm";
import { updateCreditNote } from "@/app/actions/credit-notes";
import { generateId } from "@/lib/utils";

interface Props {
  creditNote: { id: number; templateId: number | null; clientName: string | null; clientBranch: string | null; creditNoteNumber: string; creditNoteDate: string | null; subject: string | null; notes: string | null; placeOfSupply: string | null; status: string; showTotal: boolean; createdAt: Date; items: { description: string; quantity: number; rate: number; taxed: string | null; amount: number }[] };
}

export default function EditCreditNoteClient({ creditNote: cn }: Props) {
  const router = useRouter();
  const initialValues = {
    templateId: cn.templateId, clientName: cn.clientName || "", clientBranch: cn.clientBranch || "",
    docNumber: cn.creditNoteNumber, date: cn.creditNoteDate || new Date(cn.createdAt).toISOString().split("T")[0],
    expiryDate: "", subject: cn.subject || "", notes: cn.notes || "", terms: cn.notes || "",
    placeOfSupply: cn.placeOfSupply || "Maharashtra (27)", status: cn.status, showTotal: cn.showTotal,
    items: cn.items.map((i) => ({ id: generateId(), description: i.description, qty: i.quantity, rate: i.rate, hsn: i.taxed || "", amount: i.amount })),
  };

  async function handleSave(values: DocumentFormValues, subtotal: number) {
    const { createClient, getClients, ensureBranchExists } = await import("@/app/actions/clients");
    const allClients = await getClients();
    let client = allClients.find((c) => c.name.toLowerCase() === values.clientName.toLowerCase());
    if (!client) client = await createClient({ name: values.clientName, contactPerson: null, phone: null, email: null, address: null });
    if (client && values.clientBranch) await ensureBranchExists(client.id, values.clientBranch);

    await updateCreditNote(cn.id, { templateId: values.templateId, clientId: client.id, creditNoteNumber: values.docNumber || undefined, clientBranch: values.clientBranch || null, subject: values.subject || null, notes: values.terms || values.notes || null, placeOfSupply: values.placeOfSupply || null, creditNoteDate: values.date, status: values.status, showTotal: values.showTotal },
      values.items.filter((i) => i.description || i.amount > 0).map((i) => ({ description: i.description, quantity: i.qty, rate: i.rate, taxed: i.hsn || null, amount: i.amount })));
    router.push(`/credit-notes/${cn.id}`);
  }

  return <DocumentForm mode="credit_note" initialValues={initialValues} isEdit={true} onSave={handleSave} backHref={`/credit-notes/${cn.id}`} backLabel="Back to Credit Note" />;
}
