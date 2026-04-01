import { notFound } from "next/navigation";
import { getProject } from "@/app/actions/projects";
import { getLabourEntries, getProjectLabourTotal } from "@/app/actions/labour";
import { getExpenses, getProjectExpenseTotal } from "@/app/actions/expenses";
import { getScrapEntries, getScrapTotals } from "@/app/actions/scrap";
import ProjectDetailClient from "./client";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectId = Number(id);
  const project = await getProject(projectId);
  if (!project) notFound();

  const [
    labourList,
    expenseList,
    scrapList,
    labourTotal,
    expenseTotal,
    scrapTotals,
  ] = await Promise.all([
    getLabourEntries(projectId),
    getExpenses(projectId),
    getScrapEntries(projectId),
    getProjectLabourTotal(projectId),
    getProjectExpenseTotal(projectId),
    getScrapTotals(projectId),
  ]);

  const totalCost = labourTotal + expenseTotal;
  const profit = project.quotedAmount - totalCost + scrapTotals.profit;
  const profitPct =
    project.quotedAmount > 0
      ? ((profit / project.quotedAmount) * 100).toFixed(1)
      : "0.0";

  return (
    <ProjectDetailClient
      project={project}
      labourList={labourList}
      expenseList={expenseList}
      scrapList={scrapList}
      labourTotal={labourTotal}
      expenseTotal={expenseTotal}
      totalCost={totalCost}
      profit={profit}
      profitPct={profitPct}
      scrapTotals={scrapTotals}
    />
  );
}
