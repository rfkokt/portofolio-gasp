"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function VelocityHero() {
  const container = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLHeadingElement | null)[]>([]);

  useGSAP(
    () => {
      let currentScroll = window.scrollY;
      
      const updateSkew = () => {
        const newScroll = window.scrollY;
        const dt = newScroll - currentScroll;
        const skew = Math.min(Math.max(dt * 0.15, -10), 10); // Cap skew
        
        textRefs.current.forEach((text, i) => {
            if (text) {
                // Alternating skew direction
                const dir = i % 2 === 0 ? 1 : -1;
                gsap.to(text, {
                    skewX: skew * dir,
                    duration: 0.2, // Smooth ease out
                    ease: "power3.out",
                    overwrite: true
                });
            }
        });

        currentScroll = newScroll;
      };

      // Use GSAP ticker for performance
      gsap.ticker.add(updateSkew);

      return () => {
        gsap.ticker.remove(updateSkew);
      };
    },
    { scope: container }
  );

  return (
    <section id="velocity" ref={container} className="h-screen flex flex-col justify-center items-center relative overflow-hidden">
      <div className="absolute top-32 text-center section-label">
        [ SCROLL TO DEFORM ]
      </div>
      
      <div className="text-center space-y-4">
        <h1 
            ref={(el) => { textRefs.current[0] = el; }}
            className="text-[12vw] font-black leading-[0.8] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-600 will-change-transform"
        >
            KINETIC
        </h1>
        <h1 
            ref={(el) => { textRefs.current[1] = el; }}
            className="text-[12vw] font-black leading-[0.8] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-neutral-600 to-neutral-900 will-change-transform"
        >
            ENGINE
        </h1>
      </div>
    </section>
  );
}
