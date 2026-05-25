import { getInvoices } from "@/app/actions/invoices";
import { getQuotations } from "@/app/actions/quotations";
import InvoicesClient from "./invoices-client";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
  }>;
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 25;
  const status = params.status || "all";

  const [
    { data: invoices, totalCount },
    { data: pendingQuotations }
  ] = await Promise.all([
    getInvoices({
      page,
      limit,
      status,
    }),
    getQuotations({
      statuses: ["accepted", "sent"],
    }),
  ]);

  return (
    <InvoicesClient
      invoices={invoices}
      totalCount={totalCount}
      pendingQuotations={pendingQuotations}
      currentPage={page}
      limit={limit}
      activeStatus={status}
    />
  );
}
