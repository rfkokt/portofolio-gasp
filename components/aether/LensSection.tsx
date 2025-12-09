"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function LensSection() {
  const containerRef = useRef<HTMLElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

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

  return (
    <section
      id="lens"
      ref={containerRef}
      className="relative h-screen w-full bg-black overflow-hidden border-t border-[#222] select-none cursor-crosshair"
      style={
        {
          "--lens-x": "50%",
          "--lens-y": "50%",
        } as React.CSSProperties
      }
    >
      <div className="section-label text-white border-white absolute top-8 left-8 z-20 font-mono text-[10px] tracking-widest border px-2 py-1 rounded backdrop-blur-sm bg-black/50 uppercase">
        [ 07. FOCUS LENS ]
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

      <div className="lens-ui absolute inset-0 grid grid-cols-[1fr_2fr_1fr] gap-16 p-16 place-content-center pointer-events-none text-[#333]">
        <div className="flex flex-col justify-between h-full py-20 border-r pr-10 border-white/5">
          <div className="space-y-4 font-mono">
            <div className="flex justify-between border-b border-[#222] py-4">
              <span>SYS_ID</span>
              <span>--</span>
            </div>
            <div className="flex justify-between border-b border-[#222] py-4">
              <span>STATUS</span>
              <span>OFFLINE</span>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center">
          <h2 className="text-[8vw] font-black leading-none">DATA</h2>
        </div>
        <div className="flex flex-col justify-end h-full py-20 border-l pl-10 text-right border-white/5">
          <div className="flex justify-between border-b border-[#222] py-4 font-mono">
            <span>ENCRYPTED</span>
          </div>
        </div>
      </div>

      {/* LAYER 2: FOCUSED */}
      <div
        className="lens-focus-layer absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672')",
          maskImage:
            "radial-gradient(250px circle at var(--lens-x) var(--lens-y), black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(250px circle at var(--lens-x) var(--lens-y), black 0%, transparent 100%)",
        }}
      />

      <div
        className="lens-ui absolute inset-0 grid grid-cols-[1fr_2fr_1fr] gap-16 p-16 place-content-center pointer-events-none text-white"
        style={{
          maskImage:
            "radial-gradient(250px circle at var(--lens-x) var(--lens-y), black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(250px circle at var(--lens-x) var(--lens-y), black 0%, transparent 100%)",
        }}
      >
        <div className="flex flex-col justify-between h-full py-20 border-r pr-10 border-white/20">
          <div className="space-y-4 font-mono text-[#06b6d4]">
            <div className="flex justify-between border-b border-white/20 py-4 font-bold">
              <span className="text-white">SYS_ID</span>
              <span>AE-9000</span>
            </div>
            <div className="flex justify-between border-b border-white/20 py-4 font-bold">
              <span className="text-white">STATUS</span>
              <span className="text-emerald-400">ONLINE</span>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center">
          <h2 className="text-[8vw] font-black leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
            DATA
          </h2>
        </div>
        <div className="flex flex-col justify-end h-full py-20 border-l pl-10 text-right border-white/20">
          <div className="flex justify-between border-b border-white/20 py-4 font-bold font-mono text-[#06b6d4]">
            <span className="text-white">PACKET_01</span>
            <span>0x44..F2</span>
          </div>
        </div>
      </div>

      {/* HUD */}
      <div
        ref={hudRef}
        className="absolute w-[250px] h-[250px] border border-white/50 rounded-full z-50 pointer-events-none animate-spin-slow"
        style={{
          left: "calc(var(--lens-x) - 125px)",
          top: "calc(var(--lens-y) - 125px)",
          animation: "spin 10s linear infinite",
        }}
      />
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
