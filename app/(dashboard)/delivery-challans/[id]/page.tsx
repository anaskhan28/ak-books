import { notFound } from "next/navigation";
import { getDeliveryChallan } from "@/app/actions/delivery-challans";
import { getClients } from "@/app/actions/clients";
import DCDetailClient from "./client";
import { Suspense } from "react";

export default async function DeliveryChallanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [dc, clients] = await Promise.all([getDeliveryChallan(Number(id)), getClients()]);
  if (!dc) notFound();
  return <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}><DCDetailClient deliveryChallan={dc} clients={clients} /></Suspense>;
}
