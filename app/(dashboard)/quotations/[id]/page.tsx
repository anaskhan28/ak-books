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

  // Parallel fetch: quotation + clients at the same time
  const [quotation, clients] = await Promise.all([
    getQuotation(Number(id)),
    getClients(),
  ]);

  if (!quotation) notFound();

  return <QuotationDetailClient quotation={quotation} clients={clients} />;
}
