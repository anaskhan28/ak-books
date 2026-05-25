import { notFound } from "next/navigation";
import { getDeliveryChallan } from "@/app/actions/delivery-challans";
import EditDCClient from "./edit-client";

export default async function EditDeliveryChallanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dc = await getDeliveryChallan(Number(id));
  if (!dc) notFound();
  return <EditDCClient deliveryChallan={dc} />;
}
