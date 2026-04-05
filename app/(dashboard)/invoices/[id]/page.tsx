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
  const invoice = await getInvoice(Number(id));
  if (!invoice) notFound();

  const clients = await getClients();

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading invoice details...</div>}>
      <InvoiceDetailClient invoice={invoice} clients={clients} />
    </Suspense>
  );
}
