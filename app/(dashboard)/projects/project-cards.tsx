"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Trash2 } from "lucide-react";
import { deleteProject } from "@/app/actions/projects";
import StatusBadge from "@/components/ui/status-badge";
import { formatINR } from "@/lib/utils";

type CardData = {
  id: number;
  name: string;
  clientName: string | null;
  workType: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  location: string | null;
  workers: number;
  totalCost: number;
  pl: number;
};

export default function ProjectCards({ cards }: { cards: CardData[] }) {
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent, id: number, name: string) {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        `Delete "${name}"? This will remove all labour, expenses and scrap entries.`,
      )
    )
      return;
    await deleteProject(id);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {cards.map((p) => (
        <Link
          key={p.id}
          href={`/projects/${p.id}`}
          className="bg-surface border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/20 transition-all group relative"
        >
          {/* Delete Button */}
          <button
            onClick={(e) => handleDelete(e, p.id, p.name)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-muted opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger transition-all"
          >
            <Trash2 size={14} />
          </button>

          <div className="flex items-start justify-between gap-3 mb-1 pr-8">
            <div className="min-w-0 flex-1">
              <h3 className="text-[16px] font-medium text-neutral-700 truncate group-hover:text-primary transition-colors">
                {p.name}
              </h3>
              <p className="text-[13px] text-muted mt-0.5">{p.workType}</p>
            </div>
            <StatusBadge status={p.status} />
          </div>

          {p.location && (
            <div className="flex items-center gap-1.5 text-[12px] text-muted mb-4">
              <MapPin size={12} className="text-danger" />
              {p.location}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-background rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] font-medium text-muted  tracking-wider mb-0.5">
                Workers
              </p>
              <p className="text-[17px] font-medium text-neutral-700">
                {p.workers}
              </p>
            </div>
            <div className="bg-background rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] font-medium text-muted  tracking-wider mb-0.5">
                Cost
              </p>
              <p className="text-[17px] font-medium text-muted">
                {formatINR(p.totalCost)}
              </p>
            </div>
            <div className="bg-background rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] font-medium text-muted  tracking-wider mb-0.5">
                P/L
              </p>
              <p
                className={`text-[17px] font-medium ${p.pl >= 0 ? "text-success" : "text-danger"}`}
              >
                {p.pl >= 0 ? "+" : "-"}
                {formatINR(Math.abs(p.pl))}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-muted">
            {p.startDate || "No date"}
            {p.endDate ? ` → ${p.endDate}` : ""}
          </p>
        </Link>
      ))}
    </div>
  );
}
