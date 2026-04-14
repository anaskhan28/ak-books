import { notFound } from "next/navigation";
import { getInvoice } from "@/app/actions/invoices";
import { getClients } from "@/app/actions/clients";
import InvoiceDetailClient from "./client";
import { Suspense } from "react";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Parallel fetch: invoice + clients at the same time
  const [invoice, clients] = await Promise.all([
    getInvoice(Number(id)),
    getClients(),
  ]);

  if (!invoice) notFound();

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading invoice details...</div>}>
      <InvoiceDetailClient invoice={invoice} clients={clients} />
    </Suspense>
  );
}
