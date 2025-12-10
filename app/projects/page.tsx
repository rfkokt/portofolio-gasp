import { prisma } from "@/lib/prisma";
import { SpotlightGrid } from "@/components/aether/SpotlightGrid";

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="section-label mb-8">[ 02. ARCHIVE ]</div>
        <h1 className="text-6xl md:text-8xl font-black text-foreground tracking-tighter">
          SELECTED<br />WORKS
        </h1>
      </div>

      <SpotlightGrid projects={projects} />
      
      <div className="max-w-7xl mx-auto px-6 mt-12 text-right">
        <div className="text-muted-foreground text-sm font-mono uppercase">
            Total Projects: {projects.length}
        </div>
      </div>
    </div>
  );
}
