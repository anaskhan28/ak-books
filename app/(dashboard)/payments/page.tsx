import { getPayments } from "@/app/actions/payments";
import { getInvoices } from "@/app/actions/invoices";
import PaymentsClient from "./payments-client";

export const metadata = {
  title: "Payments | AK Books",
  description: "Track client payments against invoices",
};

export default async function PaymentsPage() {
  const [paymentList, allInvoices] = await Promise.all([
    getPayments(),
    getInvoices(),
  ]);

  return (
    <PaymentsClient
      payments={paymentList}
      invoices={allInvoices}
    />
  );
}
