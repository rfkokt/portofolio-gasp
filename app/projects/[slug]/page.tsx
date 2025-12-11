import { getProjectBySlug, getProjectSlugs, getPbImage } from "@/lib/pocketbase";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const projects = await getProjectSlugs();
    return projects.map((p) => ({ slug: p.slug }));
  } catch (error) {
    console.warn("PocketBase not available at build time.");
    return [];
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  
  let project;
  try {
      project = await getProjectBySlug(slug);
  } catch (e) {
      notFound();
  }

  const imageUrl = project.image ? getPbImage(project.collectionId, project.id, project.image) : null;

  return (
    <article className="min-h-screen bg-background pt-32 pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <Link 
            href="/projects" 
            className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground mb-12 hover:text-foreground transition-colors"
        >
            ← BACK TO ARCHIVE
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
            <div>
                <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter mb-8 leading-none">
                    {project.title}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                    {project.description}
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                    {project.tech_stack?.map((tech: string) => (
                        <span key={tech} className="px-3 py-1 border border-border rounded-full text-xs font-mono uppercase">
                            {tech}
                        </span>
                    ))}
                </div>

                <div className="flex gap-4">
                    {project.demo_url && (
                        <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-foreground text-background font-bold rounded hover:opacity-90 transition-opacity">
                            View Demo
                        </a>
                    )}
                    {project.repo_url && (
                        <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-border text-foreground font-bold rounded hover:bg-foreground/5 transition-colors">
                            View Code
                        </a>
                    )}
                </div>
            </div>

            <div className="relative aspect-video lg:aspect-square bg-foreground/5 rounded-2xl overflow-hidden border border-border">
                {imageUrl && (
                    <Image
                        src={imageUrl}
                        alt={project.title}
                        fill
                        className="object-cover"
                        priority
                    />
                )}
            </div>
        </div>

        <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-li:text-muted-foreground border-t border-border pt-12">
            <div dangerouslySetInnerHTML={{ __html: project.content }}></div>
        </div>
      </div>
    </article>
  );
}
