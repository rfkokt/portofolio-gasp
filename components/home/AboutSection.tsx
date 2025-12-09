"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function AboutSection() {
  const container = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const text = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(title.current, {
        scrollTrigger: {
            trigger: container.current,
            start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      });

      gsap.from(text.current, {
        scrollTrigger: {
            trigger: container.current,
            start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: "power3.out"
      });
    },
    { scope: container }
  );

  return (
    <section id="about" ref={container} className="py-32 px-6 container mx-auto relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        <h2 ref={title} className="text-4xl md:text-5xl font-black mb-12 tracking-tight">
          About <span className="text-primary">Me</span>
        </h2>

        <div ref={text} className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start text-lg text-zinc-400 leading-relaxed">
           <div className="space-y-6">
              <p>
                I'm a Frontend Developer passionate about bridging the gap between design and engineering. 
                I specialize in building performant, accessible, and beautiful web applications using modern technologies.
              </p>
              <p>
                With a strong focus on user experience and animation, I strive to create digital products that feel alive and responsive.
              </p>
           </div>
           
           <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-6">Tech Stack</h3>
                <ul className="grid grid-cols-2 gap-4 text-sm font-mono">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> React / Next.js</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> TypeScript</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Tailwind CSS</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> GSAP</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Node.js</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> WebGL</li>
                </ul>
           </div>
        </div>
      </div>
    </section>
  );
}
