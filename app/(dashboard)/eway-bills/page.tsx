import { getEwayBills } from "@/app/actions/eway-bills";
import { getTemplates } from "@/app/actions/templates";
import EwayBillsClient from "./eway-bills-client";

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; status?: string; template?: string }>;
}

export default async function EwayBillsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 25;
  const status = params.status || "all";
  const templateParam = params.template;
  const templateId = templateParam && templateParam !== "all" ? parseInt(templateParam, 10) : undefined;

  const [{ data, totalCount }, templates] = await Promise.all([
    getEwayBills({ page, limit, status, templateId }),
    getTemplates(),
  ]);

  return <EwayBillsClient ewayBills={data} totalCount={totalCount} templates={templates} currentPage={page} limit={limit} activeStatus={status} activeTemplateId={templateParam || "all"} />;
}
