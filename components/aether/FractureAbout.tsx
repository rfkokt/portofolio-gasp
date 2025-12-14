"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Link from "next/link";
import Image from "next/image";
import { ProjectRecord } from "@/lib/pb_schema";
import { getPbImage } from "@/lib/pocketbase";

interface FractureAboutProps {
    projects: ProjectRecord[];
}

export function FractureAbout({ projects }: FractureAboutProps) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const slices = container.current?.querySelectorAll(".folder-slice");
      if (!slices || slices.length === 0) return;
      
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
    <section id="about" ref={container} className="h-screen w-full bg-background overflow-hidden flex flex-col items-center justify-start pt-24 md:pt-0 md:justify-center relative border-t border-border md:cursor-none">
      <div className="section-label transition-colors duration-500">[ 02. ABOUT ]</div>
      
      {/* Container for the stacked folders */}
      <div className="fracture-container flex w-[90%] md:w-[80%] h-[55vh] md:h-[70vh] relative z-10 items-center justify-center px-4">
        {projects.length === 0 ? (
             <div className="flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-border/30 p-12 rounded-xl bg-background/20 backdrop-blur-sm">
                <div className="text-4xl md:text-6xl font-black text-muted-foreground/20 tracking-tighter">
                    NO SIGNAL
                </div>
                <p className="text-sm font-mono text-muted-foreground tracking-widest uppercase">
                    [ Projects Database Empty ]
                </p>
             </div>
        ) : (
            projects.map((project, i) => (
            <Link 
                key={project.id} 
                href={`/projects/${project.slug}`}
                className="folder-slice relative h-full bg-muted border-r border-border transition-all duration-500 ease-out overflow-hidden group first:rounded-l-xl last:rounded-r-xl last:border-r-0 hover:z-20 md:cursor-none will-change-transform"
                style={{
                    flex: "1 1 0%", // Start equal
                    minWidth: "60px", // Prevent crushing
                    marginRight: "-20px", // Overlap effect
                    zIndex: i,
                    maskImage: "linear-gradient(to right, black 95%, transparent 100%)" // Soft edge for overlap
                }}
            >
                {project.image ? (
                    <Image 
                        src={getPbImage(project.collectionId, project.id, project.image)}
                        alt={project.title}
                        fill
                        className="object-cover object-center grayscale-0 md:grayscale md:group-hover:grayscale-0 transition-all duration-700 ease-out opacity-100 md:opacity-60 md:group-hover:opacity-100"
                        sizes="(max-width: 768px) 25vw, 20vw"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
                )}
                
                {/* Folder Tab/Label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* ID Background - Visible on mobile now, increased contrast */}
                        <span className="absolute top-2 left-2 text-xl md:top-4 md:left-4 md:text-4xl font-black text-foreground/50 md:text-foreground/20 group-hover:text-foreground/60 transition-colors">
                            0{i + 1}
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
            ))
        )}
      </div>

       <div className="absolute top-[55%] left-4 right-4 md:top-auto md:bottom-10 md:left-20 md:right-auto max-w-2xl z-20 md:cursor-none">
         <div className="bg-background/90 md:bg-background/60 backdrop-blur-md p-4 md:p-8 border border-border rounded-xl">
            <h2 className="text-xl md:text-4xl font-bold mb-2 md:mb-6 font-mono text-foreground">About RDev</h2>
            <div className="space-y-2 md:space-y-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
                <p>
                    I'm a Frontend Developer with a passion for React, Next.js, and TypeScript. 
                    But what really drives me is building interfaces that don't just look good—they work for everyone.
                </p>
                <p>
                    Since 2018, I've been on a mission to merge cutting-edge frontend development with accessibility best practices. 
                </p>
            </div>
            
            <div className="mt-4 md:mt-8">
                <Link href="/projects" className="inline-block border border-border hover:bg-foreground hover:text-background text-foreground px-4 md:px-6 py-2 md:py-3 rounded-lg font-mono text-xs md:text-sm tracking-widest uppercase transition-colors md:cursor-none">
                    View All Projects
                </Link>
            </div>
         </div>
       </div>

    </section>
  );
}
