import { Plus } from "lucide-react";
import Link from "next/link";
import { getProjects } from "@/app/actions/projects";
import { getAllProjectLabourStats } from "@/app/actions/labour";
import { getAllProjectExpenseTotals } from "@/app/actions/expenses";
import { getAllProjectScrapProfits } from "@/app/actions/scrap";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import ProjectCards from "@/app/(dashboard)/projects/project-cards";

export default async function ProjectsPage() {
  const [projectList, labourStats, expenseTotals, scrapProfits] =
    await Promise.all([
      getProjects(),
      getAllProjectLabourStats(),
      getAllProjectExpenseTotals(),
      getAllProjectScrapProfits(),
    ]);

  const cards = projectList.map((p) => {
    const labour = labourStats.get(p.id) || { workers: 0, cost: 0 };
    const expenseTotal = expenseTotals.get(p.id) || 0;
    const scrapProfit = scrapProfits.get(p.id) || 0;
    const totalCost = labour.cost + expenseTotal;
    const pl = p.quotedAmount - totalCost + scrapProfit;
    return { ...p, workers: labour.workers, totalCost, pl };
  });

  return (
    <div className="p-2 md:p-0">
      <PageHeader
        title="Projects / Jobs"
        subtitle="Manage all your bank infrastructure projects"
        action={
          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-semibold hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
          >
            <Plus size={16} />
            New Project
          </Link>
        }
      />

      {cards.length === 0 ? (
        <EmptyState
          title="No projects yet"
          message="Create your first project to start tracking jobs."
        />
      ) : (
        <ProjectCards cards={cards} />
      )}
    </div>
  );
}
