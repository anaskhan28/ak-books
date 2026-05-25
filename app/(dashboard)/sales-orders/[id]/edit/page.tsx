import { notFound } from "next/navigation";
import { getSalesOrder } from "@/app/actions/sales-orders";
import EditSalesOrderClient from "./edit-client";

export default async function EditSalesOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const salesOrder = await getSalesOrder(Number(id));
  if (!salesOrder) notFound();
  return <EditSalesOrderClient salesOrder={salesOrder} />;
}
