"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { AlertTriangle, X } from "lucide-react";
import "highlight.js/styles/atom-one-dark.css";

interface PreviewProject {
  title: string;
  slug: string;
  description: string;
  content: string;
  image?: string;
  tech_stack?: string[];
  demo_url?: string;
  repo_url?: string;
}

export default function ProjectPreviewPage() {
  const [project, setProject] = useState<PreviewProject | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Read preview data from localStorage
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

  return (
    <article className="min-h-screen bg-background pt-32 pb-20 transition-colors duration-300">
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

      <div className="max-w-7xl mx-auto px-6 pt-10">
        <Link 
            href="/cms/projects" 
            className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground mb-12 hover:text-foreground transition-colors"
        >
            ← BACK TO EDITOR
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

            <div className="relative aspect-video lg:aspect-square bg-foreground/5 rounded-2xl overflow-hidden border border-border flex items-center justify-center">
                {project.image ? (
                    <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <span className="text-muted-foreground text-sm">No image</span>
                )}
            </div>
        </div>

        <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-li:text-muted-foreground border-t border-border pt-12">
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {project.content}
            </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
