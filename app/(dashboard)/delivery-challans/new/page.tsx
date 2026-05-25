"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { DocumentForm, DocumentFormValues } from "@/components/document/DocumentForm";
import { createDeliveryChallan } from "@/app/actions/delivery-challans";
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

    const dc = await createDeliveryChallan(
      { challanNumber: values.docNumber || undefined, templateId: values.templateId, clientId: client.id, subject: values.subject || null, clientBranch: values.clientBranch || null, totalAmount: subtotal, status: values.status || "draft", notes: values.terms || null, placeOfSupply: values.placeOfSupply || null, challanDate: values.date, showTotal: values.showTotal, vehicleNumber: values.vehicleNumber || null, transportMode: values.transportMode || null, dispatchDate: values.dispatchDate || null },
      values.items.filter((i) => i.description || i.amount > 0).map((i) => ({ description: i.description, quantity: i.qty, rate: i.rate, taxed: i.hsn || null, amount: i.amount })),
    );
    router.push(`/delivery-challans/${dc.id}`);
  }

  return <DocumentForm mode="delivery_challan" initialValues={{ templateId: preselectedTemplateId }} onSave={handleSave} backHref="/delivery-challans" backLabel="Back to Challans" />;
}

export default function NewDeliveryChallanPage() {
  return <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}><Content /></Suspense>;
}
