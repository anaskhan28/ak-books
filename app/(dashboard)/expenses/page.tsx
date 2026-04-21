import { getExpenses } from "@/app/actions/expenses";
import { getProjects } from "@/app/actions/projects";
import ExpensesClient from "./expenses-client";
import { Suspense } from "react";
import ExpensesLoading from "./loading";

export const metadata = {
  title: "Expenses | AK Books",
  description: "Track project-wise expenses",
};

export default async function ExpensesPage() {
  const [expenseList, projectList] = await Promise.all([
    getExpenses(),
    getProjects(),
  ]);

  const simplifiedProjects = projectList.map(({ id, name }) => ({ id, name }));

  return (
    <Suspense fallback={<ExpensesLoading />}>
      <ExpensesClient
        expenses={expenseList}
        projects={simplifiedProjects}
      />
    </Suspense>
  );
}
