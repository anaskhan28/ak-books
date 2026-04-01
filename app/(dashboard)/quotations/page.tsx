import { getQuotations } from "@/app/actions/quotations";
import { getTemplates } from "@/app/actions/templates";
import QuotationsClient from "./quotations-client";

export default async function QuotationsPage() {
  const [quotationList, templates] = await Promise.all([
    getQuotations(),
    getTemplates(),
  ]);
  return (
    <QuotationsClient quotations={quotationList} templates={templates} />
  );
}
