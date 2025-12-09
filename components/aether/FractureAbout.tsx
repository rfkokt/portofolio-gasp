"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

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
            y: yVal * 40 * dir,
            duration: 0.5,
            ease: "power2.out",
            overwrite: true
          });
        });
      };

      const onMouseLeave = () => {
        slices?.forEach((slice) => {
          gsap.to(slice, {
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            overwrite: true
          });
        });
      };

      const fractureContainer = container.current?.querySelector(".fracture-container");
      fractureContainer?.addEventListener("mousemove", onMouseMove as any);
      fractureContainer?.addEventListener("mouseleave", onMouseLeave);

      return () => {
        fractureContainer?.removeEventListener("mousemove", onMouseMove as any);
        fractureContainer?.removeEventListener("mouseleave", onMouseLeave);
      };
    },
    { scope: container }
  );

  return (
    <section id="about" ref={container} className="h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-center relative border-t border-[#222]">
      <div className="section-label">[ 02. MOUSE FRACTURE ]</div>
      
      {/* Container for the fractured slices */}
      <div className="fracture-container flex w-[80%] h-[70vh] gap-1 relative z-10">
        {[1.5, -1.2, 2, -1.5, 1].map((dir, i) => (
          <div key={i} className="f-slice flex-1 relative overflow-hidden h-full bg-[#111] transition-transform will-change-transform" data-dir={dir}>
            <div 
                className="f-bg absolute top-[-20%] left-0 w-full h-[140%] bg-cover bg-center grayscale hover:grayscale-0 transition-all duration-500"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2600')",
                    backgroundPosition: `${5 + i * 22.5}% 50%`
                }}
            />
          </div>
        ))}
      </div>

       <div className="absolute bottom-20 left-10 max-w-md pointer-events-none mix-blend-difference z-20">
         <h2 className="text-4xl font-bold mb-4">About Me</h2>
         <p className="text-sm text-neutral-400">
           Front-end developer traversing the digital void. I build kinetic interfaces that respond to human intent. 
           Specializing in React, WebGL, and Next.js.
         </p>
       </div>
    </section>
  );
}
