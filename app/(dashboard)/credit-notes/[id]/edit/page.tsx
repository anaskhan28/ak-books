import { notFound } from "next/navigation";
import { getCreditNote } from "@/app/actions/credit-notes";
import EditCreditNoteClient from "./edit-client";

export default async function EditCreditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cn = await getCreditNote(Number(id));
  if (!cn) notFound();
  return <EditCreditNoteClient creditNote={cn} />;
}
