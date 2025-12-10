import Link from "next/link";
import { notFound } from "next/navigation";
import { MoveLeft } from "lucide-react";
import { ShareButton } from "@/components/aether/ShareButton";

// Dummy data matching FractureAbout.tsx
const DUMMY_PROJECTS: Record<string, { title: string; image: string; description: string; category: string }> = {
  "project-alpha": {
    title: "Project Alpha",
    image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2600",
    description: "A revolutionary interface for next-gen data visualization. Project Alpha explores the boundaries of WebGL and React to create immersive 3D experiences for enterprise analytics.",
    category: "Development"
  },
  "project-beta": {
    title: "Project Beta",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2600",
    description: "An e-commerce platform built with accessibility at its core. Project Beta demonstrates how inclusion drives innovation, featuring keyboard-first navigation and screen reader optimization.",
    category: "Design System"
  },
  "project-gamma": {
    title: "Project Gamma",
    image: "https://images.unsplash.com/photo-1519638399535-1b036603ac77?q=80&w=2600",
    description: "A mobile-first health tracking application. Gamma uses framer-motion and confident design patterns to encourage daily engagement with personal health metrics.",
    category: "Mobile App"
  },
  "project-delta": {
    title: "Project Delta",
    image: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2600",
    description: "Financial portfolio management re-imagined. Delta simplifies complex data streams into actionable insights using clean typography and minimalist data viz.",
    category: "Fintech"
  },
  "project-epsilon": {
    title: "Project Epsilon",
    image: "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=2600",
    description: "AI-driven content generation tool. Epsilon bridges the gap between human creativity and machine intelligence, offering a collaborative workspace for writers.",
    category: "AI Tooling"
  },
  "neon-commerce": {
    title: "Neon Commerce",
    image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2600",
    description: "High-performance headless e-commerce storefront with 3D product previews and localized pricing.",
    category: "E-Commerce"
  }
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = DUMMY_PROJECTS[slug];

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Hero Header */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${project.image}')` }}
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-6 pb-20">
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-6 md:gap-0">
                    <div className="space-y-4 max-w-4xl">
                         <Link href="/#about" className="inline-flex items-center gap-2 text-sm font-mono text-white/80 mb-4 hover:text-white transition-colors">
                            <MoveLeft size={16} /> BACK TO PROJECTS
                        </Link>
                        <div>
                             <span className="inline-block px-3 py-1 border border-white/20 text-xs font-mono tracking-widest uppercase rounded-full bg-black/30 backdrop-blur-md mb-4 text-white">
                                {project.category}
                            </span>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mix-blend-overlay opacity-90">
                                {project.title}
                            </h1>
                        </div>
                    </div>
                    <div className="mb-4">
                        <ShareButton title={project.title} text={project.description} className="text-white border-white/20 hover:bg-white/10" side="top" align="responsive" />
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-20">
         <div className="prose prose-lg max-w-none dark:prose-invert">
            <h2 className="text-3xl font-bold mb-8 font-mono text-foreground">Overview</h2>
            <p className="text-xl text-muted-foreground leading-relaxed leading-8">
                {project.description}
            </p>
            
            <div className="my-16 p-8 border border-border rounded-2xl bg-foreground/5">
                <h3 className="text-lg font-bold mb-4 font-mono text-muted-foreground uppercase tracking-widest">Tech Stack</h3>
                <div className="flex flex-wrap gap-3">
                    {["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"].map((tech) => (
                        <span key={tech} className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground">
                            {tech}
                        </span>
                    ))}
                </div>
            </div>

            <p className="text-muted-foreground italic">
                (This is a placeholder project detail page content to demonstrate the routing from the landing page slices.)
            </p>
         </div>
      </div>
    </div>
  );
}
