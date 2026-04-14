"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DocumentForm, DocumentFormValues } from "@/components/document/DocumentForm";
import { getQuotation, updateQuotation } from "@/app/actions/quotations";
import { generateId } from "@/lib/utils";

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const [initialValues, setInitialValues] = useState<Partial<DocumentFormValues> | null>(null);

  useEffect(() => {
    async function load() {
      const dbQuotation = await getQuotation(Number(params.id));
      if (!dbQuotation) return router.push("/quotations");
      
      setInitialValues({
        templateId: dbQuotation.templateId,
        clientName: dbQuotation.clientName || "",
        clientBranch: dbQuotation.clientBranch || "",
        docNumber: dbQuotation.quotationNumber || "",
        date: dbQuotation.quotationDate || new Date(dbQuotation.createdAt).toISOString().split("T")[0],
        expiryDate: "",
        subject: dbQuotation.subject || "",
        notes: dbQuotation.notes || "",
        terms: dbQuotation.notes || "", // Load notes into terms for templates using that field
        items: dbQuotation.items.map(i => ({
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

    await updateQuotation(
      Number(params.id),
      {
         templateId: values.templateId,
         clientId: client.id,
         quotationNumber: values.docNumber || undefined,
         clientBranch: values.clientBranch || null,
         subject: values.subject || null,
         notes: values.terms || values.notes || null, // Map form terms back to DB notes
         quotationDate: values.date,
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
    router.push(`/quotations/${params.id}`);
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
      mode="quotation"
      initialValues={initialValues}
      isEdit={true}
      onSave={handleSave}
      backHref={`/quotations/${params.id}`}
      backLabel="Back to Quotation"
    />
  );
}
