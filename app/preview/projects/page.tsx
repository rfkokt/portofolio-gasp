"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { AlertTriangle, X, MoveLeft } from "lucide-react";
import "highlight.js/styles/atom-one-dark.css";
import { TableOfContents } from "@/components/blog/TableOfContents";

interface PreviewProject {
  title: string;
  slug: string;
  description: string;
  content: string;
  image?: string;
  tech_stack?: string[];
  demo_url?: string;
  repo_url?: string;
  featured?: boolean;
}

export default function ProjectPreviewPage() {
  const [project, setProject] = useState<PreviewProject | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const previewData = localStorage.getItem("project_preview");
    if (previewData) {
      try {
        setProject(JSON.parse(previewData));
      } catch {
        setError("Failed to load preview data");
      }
    } else {
      setError("No preview data found. Please open preview from the editor.");
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Preview Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link 
            href="/cms/projects" 
            className="px-6 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wider"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading preview...</div>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2600";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Preview Banner */}
      <div className="fixed top-20 left-0 right-0 bg-yellow-500 text-black py-2 px-4 z-40 flex items-center justify-center gap-4">
        <AlertTriangle className="w-4 h-4" />
        <span className="font-bold text-sm uppercase tracking-wider">Preview Mode</span>
        <span className="text-sm">This is how your project will look when published</span>
        <button
          onClick={() => window.close()}
          className="ml-4 p-1 hover:bg-black/10 rounded"
          title="Close Preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Header with Background Image */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${project.image || defaultImage}')` }}
        />
        <div className="absolute inset-0 bg-background/80 dark:bg-black/60 backdrop-blur-sm" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-6 pb-20 max-w-7xl">
            <Link 
              href="/cms/projects" 
              className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground mb-8 hover:text-foreground transition-colors"
            >
              <MoveLeft size={16} /> BACK TO EDITOR
            </Link>
            <div className="space-y-4">
              {project.featured && (
                <span className="inline-block px-3 py-1 border border-yellow-500/50 text-xs font-mono tracking-widest uppercase rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                  Featured
                </span>
              )}
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground">
                {project.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Description & Actions */}
        <div className="max-w-4xl">
          <p className="text-xl text-muted-foreground leading-relaxed mb-12">
            {project.description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-12">
            {project.demo_url && (
              <a 
                href={project.demo_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-6 py-3 bg-foreground text-background font-bold rounded hover:opacity-90 transition-opacity"
              >
                View Demo
              </a>
            )}
            {project.repo_url && (
              <a 
                href={project.repo_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-6 py-3 border border-border text-foreground font-bold rounded hover:bg-foreground/5 transition-colors"
              >
                View Code
              </a>
            )}
          </div>
          
          {/* Tech Stack */}
          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="my-16 p-8 border border-border rounded-2xl bg-muted/50">
              <h3 className="text-lg font-bold mb-4 font-mono text-muted-foreground uppercase tracking-widest">Tech Stack</h3>
              <div className="flex flex-wrap gap-3">
                {project.tech_stack.map((tech: string) => (
                  <span key={tech} className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Markdown Content with TOC */}
        {project.content && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-12">
            <main className="min-w-0">
              <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-24">
                <ReactMarkdown rehypePlugins={[rehypeHighlight, rehypeSlug]}>
                  {project.content}
                </ReactMarkdown>
              </div>
            </main>
            
            <aside className="hidden lg:block">
              <div className="sticky top-32">
                <TableOfContents content={project.content} />
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
