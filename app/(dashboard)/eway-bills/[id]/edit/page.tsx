import { notFound } from "next/navigation";
import { getEwayBill } from "@/app/actions/eway-bills";
import EditEwayBillClient from "./edit-client";

export default async function EditEwayBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eb = await getEwayBill(Number(id));
  if (!eb) notFound();
  return <EditEwayBillClient ewayBill={eb} />;
}
