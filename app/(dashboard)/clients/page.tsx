import { getClients } from "@/app/actions/clients";
import ClientsClient from "./clients-client";

export const metadata = {
  title: "Clients | AK Books",
  description: "Manage bank contacts and client information",
};

export default async function ClientsPage() {
  const allClients = await getClients();

  return <ClientsClient initialClients={allClients} />;
}
