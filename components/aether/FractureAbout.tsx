"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import Link from "next/link";

const projects = [
  {
    id: 1,
    title: "Project Alpha",
    slug: "project-alpha",
    image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2600",
    dir: 1.2
  },
  {
    id: 2,
    title: "Project Beta",
    slug: "project-beta",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2600",
    dir: -1.1
  },
  {
    id: 3,
    title: "Project Gamma", 
    slug: "project-gamma",
    image: "https://images.unsplash.com/photo-1519638399535-1b036603ac77?q=80&w=2600",
    dir: 1.5
  },
  {
    id: 4,
    title: "Project Delta",
    slug: "project-delta",
    image: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2600",
    dir: -1.3
  },
  {
    id: 5,
    title: "Project Epsilon",
    slug: "project-epsilon",
    image: "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=2600",
    dir: 1.0
  }
];

export function FractureAbout() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const slices = container.current?.querySelectorAll(".f-slice");
      
      const onMouseMove = (e: MouseEvent) => {
        if (!container.current) return;
        const rect = container.current.getBoundingClientRect();
        const yVal = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

        slices?.forEach((slice) => {
          const dir = parseFloat(slice.getAttribute("data-dir") || "1");
          gsap.to(slice, {
            y: yVal * 60 * dir, // Increased movement range for more fluid feel
            duration: 1.2, // Increased duration for smoothness
            ease: "power3.out", // Smoother easing
            overwrite: true
          });
        });
      };

      const onMouseLeave = () => {
        slices?.forEach((slice) => {
          gsap.to(slice, {
            y: 0,
            duration: 1.2,
            ease: "power3.out",
            overwrite: true
          });
        });
      };

      const fractureContainer = container.current?.querySelector(".fracture-container");
      fractureContainer?.addEventListener("mousemove", onMouseMove as any);
      fractureContainer?.addEventListener("mouseleave", onMouseLeave);

      // Section Label Highlight
      const label = container.current?.querySelector(".section-label");
      if (label) {
        gsap.fromTo(label, 
            { color: "#666", borderColor: "#222" },
            { 
                color: "#fff", 
                borderColor: "rgba(255,255,255,0.5)",
                duration: 0.5,
                scrollTrigger: {
                    trigger: container.current,
                    start: "top center",
                    end: "bottom center",
                    toggleActions: "play reverse play reverse",
                }
            }
        );
      }

      return () => {
        fractureContainer?.removeEventListener("mousemove", onMouseMove as any);
        fractureContainer?.removeEventListener("mouseleave", onMouseLeave);
      };
    },
    { scope: container }
  );

  return (
    <section id="about" ref={container} className="h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-center relative border-t border-[#222]">
      <div className="section-label transition-colors duration-500">[ 02. ABOUT ]</div>
      
      {/* Container for the fractured slices */}
      <div className="fracture-container flex w-[90%] md:w-[80%] h-[60vh] md:h-[70vh] gap-1 md:gap-2 relative z-10">
        {projects.map((project, i) => (
          <Link 
            key={project.id} 
            href={`/projects/${project.slug}`}
            className="f-slice flex-1 relative overflow-hidden h-full bg-[#111] transition-transform will-change-transform group cursor-pointer"
            data-dir={project.dir}
          >
            <div 
                className="f-bg absolute top-[-20%] left-0 w-full h-[140%] bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700 ease-out"
                style={{
                    backgroundImage: `url('${project.image}')`,
                    backgroundPosition: "center",
                }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                <span className="text-white font-mono text-xs md:text-sm tracking-widest uppercase border border-white/50 px-2 py-1 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    {project.title}
                </span>
            </div>
          </Link>
        ))}
      </div>

       <div className="absolute bottom-10 left-6 md:left-20 max-w-2xl pointer-events-none z-20">
         <div className="bg-black/60 backdrop-blur-md p-8 border border-white/10 rounded-xl">
            <h2 className="text-4xl font-bold mb-6 font-mono">About RDev</h2>
            <div className="space-y-4 text-sm text-neutral-300 leading-relaxed">
                <p>
                    I'm a Frontend Developer with a passion for React, Next.js, and TypeScript. 
                    But what really drives me is building interfaces that don't just look good—they work for everyone.
                </p>
                <p>
                    Since 2018, I've been on a mission to merge cutting-edge frontend development with accessibility best practices. 
                    Because great UI isn't just about pixels—it's about removing barriers.
                </p>
                <p>
                    When I'm not crafting components, you'll find me exploring new tools or sharing accessibility insights.
                    I believe the best tech adapts to people—not the other way around.
                </p>
            </div>
         </div>
       </div>

    </section>
  );
}
