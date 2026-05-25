import { getCreditNotes } from "@/app/actions/credit-notes";
import { getTemplates } from "@/app/actions/templates";
import CreditNotesClient from "./credit-notes-client";

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; status?: string; template?: string }>;
}

export default async function CreditNotesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 25;
  const status = params.status || "all";
  const templateParam = params.template;
  const templateId = templateParam && templateParam !== "all" ? parseInt(templateParam, 10) : undefined;

  const [{ data, totalCount }, templates] = await Promise.all([
    getCreditNotes({ page, limit, status, templateId }),
    getTemplates(),
  ]);

  return <CreditNotesClient creditNotes={data} totalCount={totalCount} templates={templates} currentPage={page} limit={limit} activeStatus={status} activeTemplateId={templateParam || "all"} />;
}
