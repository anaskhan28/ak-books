"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { DocumentForm, DocumentFormValues } from "@/components/document/DocumentForm";
import { createEwayBill } from "@/app/actions/eway-bills";
import { Suspense } from "react";

function Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTemplateId = searchParams.get("template") ? Number(searchParams.get("template")) : null;

  async function handleSave(values: DocumentFormValues, subtotal: number) {
    const { createClient, getClients } = await import("@/app/actions/clients");
    const allClients = await getClients();
    let client = allClients.find((c) => c.name.toLowerCase() === values.clientName.toLowerCase());
    if (!client) client = await createClient({ name: values.clientName, contactPerson: null, phone: null, email: null, address: null });

    const eb = await createEwayBill(
      { ewayBillNumber: values.docNumber || undefined, templateId: values.templateId, clientId: client.id, totalAmount: subtotal, status: values.status || "generated", placeOfSupply: values.placeOfSupply || null, ewayBillDate: values.date, vehicleNumber: values.vehicleNumber || null, fromPlace: values.fromPlace || null, toPlace: values.toPlace || null, transporterName: values.transporterName || null, transportDocNumber: values.transportDocNumber || null, transportDocDate: values.transportDocDate || null, transporterId: values.transporterId || null },
      values.items.filter((i) => i.description || i.amount > 0).map((i) => ({ description: i.description, quantity: i.qty, rate: i.rate, taxed: i.hsn || null, amount: i.amount })),
    );
    router.push(`/eway-bills/${eb.id}`);
  }

  return <DocumentForm mode="eway_bill" initialValues={{ templateId: preselectedTemplateId }} onSave={handleSave} backHref="/eway-bills" backLabel="Back to e-Way Bills" />;
}

export default function NewEwayBillPage() {
  return <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}><Content /></Suspense>;
}
