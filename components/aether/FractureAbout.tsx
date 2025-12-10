"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
      const slices = container.current?.querySelectorAll(".folder-slice");
      if (!slices) return;
      
      // Use matchMedia for responsive brightness
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
         // Desktop: Start dim
         gsap.set(slices, { 
            x: (i) => i * -20,
            zIndex: (i) => i,
            filter: "brightness(0.7)"
         });
      });

      mm.add("(max-width: 767px)", () => {
         // Mobile: Start bright
         gsap.set(slices, { 
            x: (i) => i * -15, // Slightly less overlap on mobile
            zIndex: (i) => i,
            filter: "brightness(1)" // Full brightness
         });
      });

      // Reset on leave
      const resetState = () => {
        // Check window width for reset state
        const isMobile = window.innerWidth < 768;
        
        gsap.to(slices, {
            x: (i) => i * (isMobile ? -15 : -20),
            scale: 1,
            width: "20%",
            filter: isMobile ? "brightness(1)" : "brightness(0.7)",
            duration: 0.5,
            ease: "power3.out"
        });
      };

      slices?.forEach((slice, i) => {
        slice.addEventListener("mouseenter", () => {
            // Darken all
            gsap.to(slices, { filter: "brightness(0.4)", duration: 0.3 });
            
            // Highlight current
            gsap.to(slice, { 
                filter: "brightness(1)", 
                width: "40%", // Expand
                duration: 0.5,
                ease: "power3.out"
            });
            
            // Adjust siblings (simple accordion logic handled by flex-grow in CSS usually, but here mixing with absolute-ish feel)
            // Actually, mixed implementation: Flex with negative margin is tricky to animate smoothly with just transforms if we want expansion.
            // Let's rely on Flexbox + GSAP 'flex-grow' or 'width' for smoothness.
        });
        
        slice.addEventListener("mouseleave", resetState);
      });

      // Section Label Highlight (Class Toggle)
      const label = container.current?.querySelector(".section-label");
      if (label) {
        ScrollTrigger.create({
            trigger: container.current,
            start: "top center",
            end: "bottom center",
            toggleClass: { targets: label, className: "active" }
        });
      }
    },
    { scope: container }
  );

  return (
    <section id="about" ref={container} className="h-screen w-full bg-background overflow-hidden flex flex-col items-center justify-center relative border-t border-border">
      <div className="section-label transition-colors duration-500">[ 02. ABOUT ]</div>
      
      {/* Container for the stacked folders */}
      <div className="fracture-container flex w-[90%] md:w-[80%] h-[60vh] md:h-[70vh] relative z-10 items-center justify-center px-4">
        {projects.map((project, i) => (
          <Link 
            key={project.id} 
            href={`/projects/${project.slug}`}
            className="folder-slice relative h-full bg-muted border-r border-border transition-all duration-500 ease-out overflow-hidden group first:rounded-l-xl last:rounded-r-xl last:border-r-0 hover:z-20"
            style={{
                flex: "1 1 0%", // Start equal
                minWidth: "60px", // Prevent crushing
                marginRight: "-20px", // Overlap effect
                zIndex: i,
                maskImage: "linear-gradient(to right, black 95%, transparent 100%)" // Soft edge for overlap
            }}
          >
            <div 
                className="absolute inset-0 bg-cover bg-center grayscale-0 md:grayscale md:group-hover:grayscale-0 transition-all duration-700 ease-out opacity-100 md:opacity-60 md:group-hover:opacity-100"
                style={{
                    backgroundImage: `url('${project.image}')`,
                }}
            />
            
            {/* Folder Tab/Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* ID Background - Visible on mobile now, increased contrast */}
                    <span className="absolute top-2 left-2 text-xl md:top-4 md:left-4 md:text-4xl font-black text-foreground/50 md:text-foreground/20 group-hover:text-foreground/60 transition-colors">
                        0{project.id}
                    </span>

                    {/* Vertical Title Group */}
                    <div className="flex flex-col items-center gap-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         {/* Rotated Title */}
                        <div className="rotate-[-90deg] whitespace-nowrap origin-center transform">
                            <span className="text-foreground font-mono text-sm md:text-lg tracking-widest uppercase border border-border px-3 py-1 bg-background/50 backdrop-blur-sm">
                                {project.title}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
          </Link>
        ))}
      </div>

       <div className="absolute bottom-10 left-6 md:left-20 max-w-2xl z-20 pointer-events-none">
         <div className="bg-background/60 backdrop-blur-md p-8 border border-border rounded-xl pointer-events-auto">
            <h2 className="text-4xl font-bold mb-6 font-mono text-foreground">About RDev</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                    I'm a Frontend Developer with a passion for React, Next.js, and TypeScript. 
                    But what really drives me is building interfaces that don't just look good—they work for everyone.
                </p>
                <p>
                    Since 2018, I've been on a mission to merge cutting-edge frontend development with accessibility best practices. 
                </p>
            </div>
            
            <div className="mt-8">
                <Link href="/projects" className="inline-block border border-border hover:bg-foreground hover:text-background text-foreground px-6 py-3 rounded-lg font-mono text-sm tracking-widest uppercase transition-colors">
                    View All Projects
                </Link>
            </div>
         </div>
       </div>

    </section>
  );
}
