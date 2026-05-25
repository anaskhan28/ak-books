"use client";
import { useRouter } from "next/navigation";
import { DocumentForm, DocumentFormValues } from "@/components/document/DocumentForm";
import { updateEwayBill } from "@/app/actions/eway-bills";
import { generateId } from "@/lib/utils";

interface Props {
  ewayBill: { id: number; templateId: number | null; clientName: string | null; ewayBillNumber: string; ewayBillDate: string | null; status: string; createdAt: Date; vehicleNumber: string | null; fromPlace: string | null; toPlace: string | null; transporterName: string | null; transporterId: string | null; transportDocNumber: string | null; transportDocDate: string | null; placeOfSupply: string | null; items: { description: string; quantity: number; rate: number; taxed: string | null; amount: number }[] };
}

export default function EditEwayBillClient({ ewayBill: eb }: Props) {
  const router = useRouter();
  const initialValues = {
    templateId: eb.templateId, clientName: eb.clientName || "", clientBranch: "",
    docNumber: eb.ewayBillNumber, date: eb.ewayBillDate || new Date(eb.createdAt).toISOString().split("T")[0],
    expiryDate: "", subject: "", notes: "", terms: "",
    placeOfSupply: eb.placeOfSupply || "Maharashtra (27)", status: eb.status, showTotal: true,
    vehicleNumber: eb.vehicleNumber || "", fromPlace: eb.fromPlace || "", toPlace: eb.toPlace || "",
    transporterName: eb.transporterName || "", transporterId: eb.transporterId || "",
    transportDocNumber: eb.transportDocNumber || "", transportDocDate: eb.transportDocDate || "",
    items: eb.items.map((i) => ({ id: generateId(), description: i.description, qty: i.quantity, rate: i.rate, hsn: i.taxed || "", amount: i.amount })),
  };

  async function handleSave(values: DocumentFormValues, subtotal: number) {
    const { createClient, getClients } = await import("@/app/actions/clients");
    const allClients = await getClients();
    let client = allClients.find((c) => c.name.toLowerCase() === values.clientName.toLowerCase());
    if (!client) client = await createClient({ name: values.clientName, contactPerson: null, phone: null, email: null, address: null });

    await updateEwayBill(eb.id, { templateId: values.templateId, clientId: client.id, ewayBillNumber: values.docNumber || undefined, placeOfSupply: values.placeOfSupply || null, ewayBillDate: values.date, status: values.status, vehicleNumber: values.vehicleNumber || null, fromPlace: values.fromPlace || null, toPlace: values.toPlace || null, transporterName: values.transporterName || null, transporterId: values.transporterId || null, transportDocNumber: values.transportDocNumber || null, transportDocDate: values.transportDocDate || null },
      values.items.filter((i) => i.description || i.amount > 0).map((i) => ({ description: i.description, quantity: i.qty, rate: i.rate, taxed: i.hsn || null, amount: i.amount })));
    router.push(`/eway-bills/${eb.id}`);
  }

  return <DocumentForm mode="eway_bill" initialValues={initialValues} isEdit={true} onSave={handleSave} backHref={`/eway-bills/${eb.id}`} backLabel="Back to e-Way Bill" />;
}
