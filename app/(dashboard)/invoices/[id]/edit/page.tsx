import { notFound } from "next/navigation";
import { getInvoice } from "@/app/actions/invoices";
import EditInvoiceClient from "./edit-client";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(Number(id));

  if (!invoice) notFound();

  return <EditInvoiceClient invoice={invoice} />;
}
