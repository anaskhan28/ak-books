import { getClients, getBranches } from "@/app/actions/clients";
import ClientsClient from "./clients-client";

export const metadata = {
  title: "Clients | AK Books",
  description: "Manage bank contacts and client information",
};

export default async function ClientsPage() {
  const allClients = await getClients();

  // Fetch branches for all clients in parallel
  const clientsWithBranches = await Promise.all(
    allClients.map(async (c) => ({
      ...c,
      branches: await getBranches(c.id),
    }))
  );

  return <ClientsClient initialClients={clientsWithBranches} />;
}
