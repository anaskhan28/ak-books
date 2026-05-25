"use client";
import { useRouter } from "next/navigation";
import { DocumentForm, DocumentFormValues } from "@/components/document/DocumentForm";
import { updateDeliveryChallan } from "@/app/actions/delivery-challans";
import { generateId } from "@/lib/utils";

interface Props {
  deliveryChallan: { id: number; templateId: number | null; clientName: string | null; clientBranch: string | null; challanNumber: string; challanDate: string | null; subject: string | null; notes: string | null; placeOfSupply: string | null; status: string; showTotal: boolean; createdAt: Date; vehicleNumber: string | null; transportMode: string | null; dispatchDate: string | null; items: { description: string; quantity: number; rate: number; taxed: string | null; amount: number }[] };
}

export default function EditDCClient({ deliveryChallan: dc }: Props) {
  const router = useRouter();
  const initialValues = {
    templateId: dc.templateId, clientName: dc.clientName || "", clientBranch: dc.clientBranch || "",
    docNumber: dc.challanNumber, date: dc.challanDate || new Date(dc.createdAt).toISOString().split("T")[0],
    expiryDate: "", subject: dc.subject || "", notes: dc.notes || "", terms: dc.notes || "",
    placeOfSupply: dc.placeOfSupply || "Maharashtra (27)", status: dc.status, showTotal: dc.showTotal,
    vehicleNumber: dc.vehicleNumber || "", transportMode: dc.transportMode || "road", dispatchDate: dc.dispatchDate || "",
    items: dc.items.map((i) => ({ id: generateId(), description: i.description, qty: i.quantity, rate: i.rate, hsn: i.taxed || "", amount: i.amount })),
  };

  async function handleSave(values: DocumentFormValues, subtotal: number) {
    const { createClient, getClients, ensureBranchExists } = await import("@/app/actions/clients");
    const allClients = await getClients();
    let client = allClients.find((c) => c.name.toLowerCase() === values.clientName.toLowerCase());
    if (!client) client = await createClient({ name: values.clientName, contactPerson: null, phone: null, email: null, address: null });
    if (client && values.clientBranch) await ensureBranchExists(client.id, values.clientBranch);

    await updateDeliveryChallan(dc.id, { templateId: values.templateId, clientId: client.id, challanNumber: values.docNumber || undefined, clientBranch: values.clientBranch || null, subject: values.subject || null, notes: values.terms || values.notes || null, placeOfSupply: values.placeOfSupply || null, challanDate: values.date, status: values.status, showTotal: values.showTotal, vehicleNumber: values.vehicleNumber || null, transportMode: values.transportMode || null, dispatchDate: values.dispatchDate || null },
      values.items.filter((i) => i.description || i.amount > 0).map((i) => ({ description: i.description, quantity: i.qty, rate: i.rate, taxed: i.hsn || null, amount: i.amount })));
    router.push(`/delivery-challans/${dc.id}`);
  }

  return <DocumentForm mode="delivery_challan" initialValues={initialValues} isEdit={true} onSave={handleSave} backHref={`/delivery-challans/${dc.id}`} backLabel="Back to Challan" />;
}
