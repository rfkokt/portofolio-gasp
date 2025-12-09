"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { Project } from "@prisma/client";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ProjectPreviewProps {
  projects: Project[];
}

export function ProjectPreview({ projects }: ProjectPreviewProps) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray(".project-card-home");
      gsap.from(cards, {
        scrollTrigger: {
            trigger: container.current,
            start: "top 70%",
        },
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out"
      });
    },
    { scope: container }
  );

  return (
    <section id="projects" ref={container} className="py-32 px-6 container mx-auto">
      <div className="flex items-end justify-between mb-16">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Selected <span className="text-primary">Works</span>
            </h2>
            <p className="text-zinc-400 text-lg">A showcase of recent digital products.</p>
          </div>
          <Link href="/projects" className="hidden md:flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">
            See All Work
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                <path d="M2.5 9.5L9.5 2.5M9.5 2.5H3.5M9.5 2.5V8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {projects.map((project) => (
          <Link href={project.link || `/projects/${project.title.toLowerCase().replace(/\s+/g, '-')}`} key={project.id} className="project-card-home group">
            <div className="aspect-[4/3] rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden relative mb-6">
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 {/* Placeholder for project image */}
                <div className="absolute inset-0 flex items-center justify-center text-zinc-800 font-mono text-xs uppercase tracking-widest">
                    {project.title} Preview
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-primary uppercase tracking-wider">{project.category}</span>
                    <span className="text-xs text-zinc-600">{new Date(project.createdAt).getFullYear()}</span>
                </div>
                <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{project.title}</h3>
                <p className="text-sm text-zinc-500 line-clamp-2">{project.description}</p>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-12 text-center md:hidden">
         <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">
            See All Work
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                <path d="M2.5 9.5L9.5 2.5M9.5 2.5H3.5M9.5 2.5V8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
      </div>
    </section>
  );
}
