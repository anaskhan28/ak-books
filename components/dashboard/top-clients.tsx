"use client";

import { Users, IndianRupee } from "lucide-react";
import { formatINR } from "@/lib/utils";
import Link from "next/link";

interface TopClient {
  id: number;
  name: string;
  amount: number;
}

interface TopClientsProps {
  clients: TopClient[];
}

export default function TopClients({ clients }: TopClientsProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden h-full flex flex-col shadow-none">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-start gap-2">
          <h3 className="text-[15px] font-medium text-foreground tracking-tight">
            Clients Per Revenue
          </h3>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          {clients.length > 0 ? (
            clients.map((client, idx) => (
              <div key={client.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center text-primary font-bold border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all text-xs">
                    {client.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-foreground group-hover:text-primary transition-colors">
                      {client.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Rank {idx + 1} • Key Client
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[14px] font-medium text-foreground">
                    {formatINR(client.amount)}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal tracking-wider uppercase">
                    Total Billing
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-40">
              <Users size={40} className="mb-2" />
              <span className="text-[12px] font-medium">
                No client data linked yet
              </span>
            </div>
          )}
        </div>

        <Link
          href="/clients"
          className="mt-8 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[12px] font-semibold text-slate-600 text-center transition-all flex items-center justify-center gap-2"
        >
          Manage All Clients
          <IndianRupee size={14} className="text-slate-400" />
        </Link>
      </div>
    </div>
  );
}
