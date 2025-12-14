import { getProjectById } from "@/actions/cms-projects";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { notFound } from "next/navigation";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProjectById(id);

  if (!result.success || !result.project) {
    notFound();
  }

  return <ProjectForm mode="edit" initialData={result.project} />;
}
