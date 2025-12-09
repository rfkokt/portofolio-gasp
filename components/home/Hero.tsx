"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";

export function Hero() {
  const container = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const subtitle = useRef<HTMLParagraphElement>(null);
  const cta = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(title.current, {
        y: 100,
        opacity: 0,
        duration: 1.2,
      })
        .from(
          subtitle.current,
          {
            y: 50,
            opacity: 0,
            duration: 1,
          },
          "-=0.8"
        )
        .from(
          cta.current,
          {
            scale: 0.8,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.6"
        );
    },
    { scope: container }
  );

  return (
    <section
      ref={container}
      className="relative min-h-screen w-full flex flex-col md:flex-row items-center justify-center overflow-hidden px-6 pt-24 md:pt-0"
    >
      {/* Left Content */}
      <div className="z-10 flex-1 flex flex-col items-start justify-center max-w-2xl md:pl-20">
        <div className="mb-6 flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Creative Suite 2.0
        </div>
        
        <h1
          ref={title}
          className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white mb-8"
        >
          Craft Visual <br />
          <span className="text-zinc-500">Stories.</span>
        </h1>

        <p
        >
          Exploring the boundaries of Digital interaction.
        </p>
      </div>
    </section>
  );
}
