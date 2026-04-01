import { notFound } from "next/navigation";
import { getQuotation } from "@/app/actions/quotations";
import { getClients } from "@/app/actions/clients";
import QuotationDetailClient from "./client";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quotation = await getQuotation(Number(id));
  if (!quotation) notFound();

  const clients = await getClients();
  return <QuotationDetailClient quotation={quotation} clients={clients} />;
}
