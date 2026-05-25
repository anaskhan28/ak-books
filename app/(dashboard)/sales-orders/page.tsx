import { getSalesOrders } from "@/app/actions/sales-orders";
import { getTemplates } from "@/app/actions/templates";
import SalesOrdersClient from "./sales-orders-client";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    template?: string;
  }>;
}

export default async function SalesOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 25;
  const status = params.status || "all";
  const templateParam = params.template;
  const templateId = templateParam && templateParam !== "all" ? parseInt(templateParam, 10) : undefined;

  const [{ data: salesOrders, totalCount }, templates] = await Promise.all([
    getSalesOrders({ page, limit, status, templateId }),
    getTemplates(),
  ]);

  return (
    <SalesOrdersClient
      salesOrders={salesOrders}
      totalCount={totalCount}
      templates={templates}
      currentPage={page}
      limit={limit}
      activeStatus={status}
      activeTemplateId={templateParam || "all"}
    />
  );
}
