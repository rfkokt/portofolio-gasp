"use client";

import { useRef, MouseEvent } from "react";
import Link from "next/link";
import { Project } from "@prisma/client";

interface SpotlightGridProps {
  projects: Project[];
}

export function SpotlightGrid({ projects }: SpotlightGridProps) {
  const onMouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <section id="spotlight" className="py-32 px-6 container mx-auto border-t border-[#222]">
      <div className="flex justify-between items-end mb-16">
        <div>
          <span className="section-label relative top-0 left-0 mb-4 inline-block">
            [ 04. INTELLIGENT LIGHTING ]
          </span>
          <h2 className="text-5xl font-bold mt-4 tracking-tighter">
            SELECTED <br /> WORK
          </h2>
        </div>
        <Link href="/projects" className="text-xs font-bold bg-white text-black px-3 py-1 rounded hover:scale-105 transition-transform uppercase">
            View All
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={project.link || `/projects/${project.title.toLowerCase().replace(/\s+/g, '-')}`}
            onMouseMove={onMouseMove}
            className="spotlight-card group relative h-[400px] overflow-hidden rounded-2xl bg-background/5 border border-border/50"
            style={{
                // Default values to prevent errors before JS runs
                "--mouse-x": "-100px",
                "--mouse-y": "-100px"
            } as React.CSSProperties}
          >
            {/* Spotlight Effect Elements (::before and ::after handled via CSS in globals or scoped class) */}
            {/* We need to ensure the CSS for spotlight-card matches the reference in globals.css or here with tailwind arbitrary values */}
            
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
                style={{
                    background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), var(--foreground), transparent 40%)`,
                    opacity: 0.1
                }}
            />
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20"
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), var(--foreground), transparent 40%)`,
                    maskImage: `linear-gradient(#fff 0 0)`,
                    WebkitMaskImage: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                    WebkitMaskComposite: `xor`,
                    maskComposite: `exclude`,
                    padding: `1px`,
                    opacity: 0.4
                }}
            />

            <div className="card-content relative z-30 h-full flex flex-col justify-end p-8">
              <div className="mb-auto opacity-50 group-hover:opacity-100 transition-opacity">
                 <span className="text-xs font-mono uppercase tracking-widest border border-border px-2 py-1 rounded">
                    {project.category}
                 </span>
              </div>
              
              <h3 className="text-2xl font-bold mb-2 group-hover:text-foreground transition-colors">{project.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                {project.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
