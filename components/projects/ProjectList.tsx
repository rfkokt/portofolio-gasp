"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { Project } from "@prisma/client";

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".project-card", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.2,
      });
    },
    { scope: container }
  );

  return (
    <div
      ref={container}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      {projects.map((project) => (
        <div
          key={project.id}
          className="project-card group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
        >
          <div className="mb-4">
            <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
              {project.category}
            </span>
            <h3 className="text-2xl font-bold mt-2 group-hover:text-purple-200 transition-colors">
              {project.title}
            </h3>
          </div>

          <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-2 mt-auto">
            {project.tech.split(",").map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-1 rounded-full bg-white/5 text-zinc-300 border border-white/5"
              >
                {t.trim()}
              </span>
            ))}
          </div>

          <Link
            href={project.link || "#"}
            className="absolute inset-0 z-10"
            aria-label={`View ${project.title}`}
          />
        </div>
      ))}
    </div>
  );
}
