import { getDeliveryChallans } from "@/app/actions/delivery-challans";
import { getTemplates } from "@/app/actions/templates";
import DeliveryChallansClient from "./delivery-challans-client";

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; status?: string; template?: string }>;
}

export default async function DeliveryChallansPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 25;
  const status = params.status || "all";
  const templateParam = params.template;
  const templateId = templateParam && templateParam !== "all" ? parseInt(templateParam, 10) : undefined;

  const [{ data, totalCount }, templates] = await Promise.all([
    getDeliveryChallans({ page, limit, status, templateId }),
    getTemplates(),
  ]);

  return (
    <DeliveryChallansClient
      deliveryChallans={data}
      totalCount={totalCount}
      templates={templates}
      currentPage={page}
      limit={limit}
      activeStatus={status}
      activeTemplateId={templateParam || "all"}
    />
  );
}
