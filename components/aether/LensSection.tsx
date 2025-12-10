"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function LensSection() {
  const containerRef = useRef<HTMLElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      container.style.setProperty("--lens-x", `${x}px`);
      container.style.setProperty("--lens-y", `${y}px`);
    };

    container.addEventListener("mousemove", onMouseMove);
    return () => container.removeEventListener("mousemove", onMouseMove);
  }, []);

  const maskStyle = isMobile
    ? { maskImage: "none", WebkitMaskImage: "none" }
    : {
        maskImage: `radial-gradient(${isHovered ? "350px" : "0px"} circle at var(--lens-x) var(--lens-y), black 0%, transparent 100%)`,
        WebkitMaskImage: `radial-gradient(${isHovered ? "350px" : "0px"} circle at var(--lens-x) var(--lens-y), black 0%, transparent 100%)`,
      };

  return (
    <section
      id="lens"
      ref={containerRef}
      className="relative h-screen w-full bg-background overflow-hidden border-t border-border select-none cursor-crosshair"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={
        {
          "--lens-x": "50%",
          "--lens-y": "50%",
        } as React.CSSProperties
      }
    >
      <div className="section-label text-foreground border-foreground absolute top-8 left-8 z-20 font-mono text-[10px] tracking-widest border px-2 py-1 rounded backdrop-blur-sm bg-background/50 uppercase">
        [ 01. MISSION ]
      </div>

      {/* LAYER 1: BLURRED */}
      <div
        className="lens-blur-layer absolute inset-0 bg-cover bg-center transition-all duration-75"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672')",
          filter: "grayscale(100%) blur(8px) brightness(0.4)",
        }}
      />

      <div className="lens-ui absolute inset-0 grid grid-cols-[1fr_2fr_1fr] gap-16 p-16 place-content-center pointer-events-none text-muted-foreground">
        <div className="flex flex-col justify-between h-full py-20 border-r pr-10 border-border/50">
          <div className="space-y-4 font-mono">
           {/* Placeholder dimmed UI */}
          </div>
        </div>
        <div className="flex justify-center items-center text-center">
            <div className="space-y-2">
                <h2 className="text-[6vw] font-black leading-none opacity-50 text-foreground">MISSION</h2>
                <p className="max-w-md mx-auto text-sm opacity-60 hidden md:block text-muted-foreground">
                    Hover to reveal the core directive.
                </p>
            </div>
        </div>
        <div className="flex flex-col justify-end h-full py-20 border-l pl-10 text-right border-border/50">
          <div className="flex justify-between border-b border-border py-4 font-mono">
            {/* Placeholder dimmed UI */}
          </div>
        </div>
      </div>

      {/* LAYER 2: FOCUSED */}
      <div
        className="lens-focus-layer absolute inset-0 bg-cover bg-center transition-[mask-image] duration-300 ease-in-out"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672')",
          ...maskStyle,
        }}
      />

      <div
        className="lens-ui absolute inset-0 flex items-center justify-center pointer-events-none text-foreground p-12 transition-[mask-image] duration-300 ease-in-out"
        style={{
          ...maskStyle,
        }}
      >
        <div className="max-w-4xl text-center space-y-8 bg-background/40 backdrop-blur-md p-12 rounded-2xl border border-border">
            <h2 className="text-5xl font-bold tracking-tight font-mono text-[#06b6d4]">
                Engineering empathy into every component
            </h2>
            <div className="space-y-6 text-lg leading-relaxed text-foreground">
                <p>
                    Here's the deal: I believe every line of code I write should make the web a little more welcoming. 
                    No fancy jargon, no "good enough" - just digital spaces that work how you need them to.
                </p>
                <p className="text-sm font-mono text-[#06b6d4]">
                    Got a disability? Different device? Unique needs? Cool — my job is to make sure none of that stops you from doing what you came to do.
                </p>
            </div>
        </div>
      </div>


      {/* HUD - Hidden on mobile */}
      {!isMobile && (
        <div
            ref={hudRef}
            className={cn(
                "absolute w-[250px] h-[250px] border border-border rounded-full z-50 pointer-events-none animate-spin-slow transition-opacity duration-300",
                isHovered ? "opacity-100" : "opacity-0"
            )}
            style={{
            left: "calc(var(--lens-x) - 125px)",
            top: "calc(var(--lens-y) - 125px)",
            animation: "spin 10s linear infinite",
            }}
        />
      )}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  );
}
