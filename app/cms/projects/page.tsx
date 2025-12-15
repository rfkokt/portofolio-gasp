import Link from "next/link";
import { getProjectsForCMS, deleteProject } from "@/actions/cms-projects";
import { Plus, Edit, ExternalLink, Star } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function ProjectsListPage() {
  const result = await getProjectsForCMS();

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await deleteProject(id);
    revalidatePath("/cms/projects");
    redirect("/cms/projects");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your portfolio projects
          </p>
        </div>
        <Link
          href="/cms/projects/new"
          className="px-6 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Projects Table */}
      <div className="border border-border">
        {result.projects.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No projects found. Create your first project!
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Tech Stack
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {result.projects.map((project: any) => (
                <tr
                  key={project.id}
                  className="border-b border-border last:border-0 hover:bg-foreground/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-foreground">
                      {project.title}
                    </span>
                    <p className="text-sm text-muted-foreground truncate max-w-md mt-1">
                      {project.description}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${project.created_by === 'AI' ? 'text-purple-500 font-medium' : 'text-muted-foreground'}`}>
                      {project.created_by || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(project.tech_stack || []).slice(0, 3).map((tech: string) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 text-xs bg-foreground/10 text-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                      {(project.tech_stack || []).length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{project.tech_stack.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {project.featured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/projects/${project.slug}`}
                        target="_blank"
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Preview"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/cms/projects/${project.id}/edit`}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <DeleteButton id={project.id} onDelete={handleDelete} itemName={project.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
