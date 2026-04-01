import { notFound } from "next/navigation";
import { getInvoice } from "@/app/actions/invoices";
import { getClients } from "@/app/actions/clients";
import InvoiceDetailClient from "./client";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(Number(id));
  if (!invoice) notFound();

  const clients = await getClients();

  return <InvoiceDetailClient invoice={invoice} clients={clients} />;
}
