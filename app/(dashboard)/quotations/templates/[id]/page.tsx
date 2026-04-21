import { getTemplate } from "@/app/actions/templates";
import TemplateEditor from "@/components/templates/TemplateEditor";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: PageProps) {
  const { id } = await params;
  const template = await getTemplate(Number(id));

  if (!template) {
    notFound();
  }

  return <TemplateEditor initialData={template} />;
}
