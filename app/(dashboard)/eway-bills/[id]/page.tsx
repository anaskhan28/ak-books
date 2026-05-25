import { notFound } from "next/navigation";
import { getEwayBill } from "@/app/actions/eway-bills";
import { getClients } from "@/app/actions/clients";
import EwayBillDetailClient from "./client";
import { Suspense } from "react";

export default async function EwayBillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [eb, clients] = await Promise.all([getEwayBill(Number(id)), getClients()]);
  if (!eb) notFound();
  return <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}><EwayBillDetailClient ewayBill={eb} clients={clients} /></Suspense>;
}
