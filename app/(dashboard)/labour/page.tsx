import { getLabourEntries } from "@/app/actions/labour";
import { getProjects } from "@/app/actions/projects";
import LabourClient from "./labour-client";
import { Suspense } from "react";
import LabourLoading from "./loading";

export const metadata = {
  title: "Labour Tracking | AK Books",
  description: "Daily worker count and cost tracking",
};

export default async function LabourPage() {
  const [labourList, projectList] = await Promise.all([
    getLabourEntries(),
    getProjects(),
  ]);

  const simplifiedProjects = projectList.map(({ id, name }) => ({ id, name }));

  return (
    <Suspense fallback={<LabourLoading />}>
      <LabourClient
        entries={labourList}
        projects={simplifiedProjects}
      />
    </Suspense>
  );
}
