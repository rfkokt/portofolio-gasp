"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function VelocityHero() {
  const container = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGSAP(
    () => {
      // --- Scroll Skew Logic (Existing) ---
      let currentScroll = window.scrollY;
      
      const updateSkew = () => {
        const newScroll = window.scrollY;
        const dt = newScroll - currentScroll;
        const skew = Math.min(Math.max(dt * 0.15, -10), 10);
        
        textRefs.current.forEach((text, i) => {
            if (text) {
                const dir = i % 2 === 0 ? 1 : -1;
                gsap.to(text, {
                    skewX: skew * dir,
                    duration: 0.2,
                    ease: "power3.out",
                    overwrite: true
                });
            }
        });
        currentScroll = newScroll;
      };

      gsap.ticker.add(updateSkew);

      // --- Starfield Warp Animation (New) ---
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let width = canvas.width = window.innerWidth;
      let height = canvas.height = window.innerHeight;

      const stars: { x: number; y: number; z: number; o: number }[] = [];
      const numStars = 800; // Density
      const centerX = width / 2;
      const centerY = height / 2;
      const fov = 300; // Field of view (depth)

      // Initialize stars
      for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * width - centerX,
            y: Math.random() * height - centerY,
            z: Math.random() * fov,
            o: Math.random(),
        });
      }

      const renderStars = () => {
        const computedStyle = getComputedStyle(document.body);
        const bgColor = computedStyle.getPropertyValue('--background');
        const fgColor = computedStyle.getPropertyValue('--foreground');
        
        ctx.clearRect(0, 0, width, height); // Clear instead of fill

        stars.forEach((star) => {
            // Move star closer
            star.z -= 0.5; // Speed

            // Reset if passes viewer
            if (star.z <= 0) {
                star.z = fov;
                star.x = Math.random() * width - centerX;
                star.y = Math.random() * height - centerY;
            }

            // Project 3D to 2D
            const scale = fov / star.z;
            const x2d = star.x * scale + centerX;
            const y2d = star.y * scale + centerY;

            // Draw only if within bounds
            if (x2d >= 0 && x2d <= width && y2d >= 0 && y2d <= height) {
                const size = (1 - star.z / fov) * 2.5; // Size based on depth
                const alpha = (1 - star.z / fov); // Opacity based on depth
                
                // Use computed color if possible, or fallback
                ctx.fillStyle = `rgba(128, 128, 128, ${alpha})`; 
                ctx.beginPath();
                ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
      };

      gsap.ticker.add(renderStars);

      const handleResize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      };
      window.addEventListener("resize", handleResize);

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

      return () => {
        gsap.ticker.remove(updateSkew);
        gsap.ticker.remove(renderStars);
        window.removeEventListener("resize", handleResize);
        ScrollTrigger.getAll().forEach(t => t.kill());
      };
    },
    { scope: container }
  );

  return (
    <section id="velocity" ref={container} className="h-screen flex flex-col justify-center items-center relative overflow-hidden bg-background">
      {/* Starfield Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
      />

      <div className="absolute top-32 text-center section-label z-10 text-muted-foreground mix-blend-difference">
        [ SCROLL TO DEFORM ]
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        <div className="text-center space-y-4 mb-12">
            <h1 
                ref={(el) => { textRefs.current[0] = el; }}
                className="text-[15vw] font-black leading-[0.8] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground will-change-transform whitespace-nowrap"
            >
                RDEV •
            </h1>
            <h1 
                ref={(el) => { textRefs.current[1] = el; }}
                className="text-[15vw] font-black leading-[0.8] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-muted-foreground to-foreground will-change-transform whitespace-nowrap"
            >
                PORTFOLIO
            </h1>
        </div>
      </div>

    </section>
  );
}
