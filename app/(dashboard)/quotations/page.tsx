import { getQuotations } from "@/app/actions/quotations";
import { getTemplates } from "@/app/actions/templates";
import QuotationsClient from "./quotations-client";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    template?: string;
  }>;
}

export default async function QuotationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 25;
  const status = params.status || "all";
  const templateParam = params.template;
  const templateId = templateParam && templateParam !== "all" ? parseInt(templateParam, 10) : undefined;

  const [{ data: quotations, totalCount }, templates] = await Promise.all([
    getQuotations({
      page,
      limit,
      status,
      templateId,
    }),
    getTemplates(),
  ]);

  return (
    <QuotationsClient
      quotations={quotations}
      totalCount={totalCount}
      templates={templates}
      currentPage={page}
      limit={limit}
      activeStatus={status}
      activeTemplateId={templateParam || "all"}
    />
  );
}
