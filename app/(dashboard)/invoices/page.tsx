import { getInvoices } from "@/app/actions/invoices";
import { getQuotations } from "@/app/actions/quotations";
import InvoicesClient from "./invoices-client";

export default async function InvoicesPage() {
  const [invoiceList, quotations] = await Promise.all([
    getInvoices(),
    getQuotations(),
  ]);

  const pendingQuotations = quotations.filter(
    (q) => q.status === "accepted" || q.status === "sent",
  );

  return (
    <InvoicesClient
      invoices={invoiceList}
      pendingQuotations={pendingQuotations}
    />
  );
}
