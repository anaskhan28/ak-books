import { notFound } from "next/navigation";
import { getSalesOrder } from "@/app/actions/sales-orders";
import { getClients } from "@/app/actions/clients";
import SalesOrderDetailClient from "./client";
import { Suspense } from "react";

export default async function SalesOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [salesOrder, clients] = await Promise.all([
    getSalesOrder(Number(id)),
    getClients(),
  ]);
  if (!salesOrder) notFound();

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading sales order...</div>}>
      <SalesOrderDetailClient salesOrder={salesOrder} clients={clients} />
    </Suspense>
  );
}
