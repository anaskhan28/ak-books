import { notFound } from "next/navigation";
import { getCreditNote } from "@/app/actions/credit-notes";
import { getClients } from "@/app/actions/clients";
import CreditNoteDetailClient from "./client";
import { Suspense } from "react";

export default async function CreditNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [cn, clients] = await Promise.all([getCreditNote(Number(id)), getClients()]);
  if (!cn) notFound();
  return <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}><CreditNoteDetailClient creditNote={cn} clients={clients} /></Suspense>;
}
