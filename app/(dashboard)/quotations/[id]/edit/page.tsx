import { notFound, redirect } from "next/navigation";
import { getQuotation } from "@/app/actions/quotations";
import EditQuotationClient from "./edit-client";

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quotation = await getQuotation(Number(id));

  if (!quotation) notFound();

  return <EditQuotationClient quotation={quotation} />;
}
