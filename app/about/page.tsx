"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function AboutPage() {
  const container = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(title.current, {
        y: 50,
        opacity: 0,
        duration: 1,
      })
      .from(content.current?.children || [], {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
      }, "-=0.5")
      .from(image.current, {
        scale: 0.9,
        opacity: 0,
        duration: 1,
      }, "-=0.8");
    },
    { scope: container }
  );

  return (
    <div ref={container} className="min-h-screen pt-32 pb-20 px-6 container mx-auto">
      <h1 ref={title} className="text-4xl md:text-6xl font-black mb-12 tracking-tight">
        About <span className="text-zinc-500">Me</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        <div ref={content} className="space-y-6 text-lg text-zinc-300">
          <p>
            I'm a Frontend Developer passionate about bridging the gap between design and engineering. 
            I specialize in building performant, accessible, and beautiful web applications using modern technologies.
          </p>
          <p>
            With a strong focus on user experience and animation, I strive to create digital products that feel alive and responsive. 
            My expertise lies in the React ecosystem, specifically Next.js, and I love experimenting with 3D web technologies like Three.js and React Three Fiber (or React Bits!).
          </p>
          
          <div className="pt-8">
            <h3 className="text-xl font-bold text-white mb-4">Tech Stack</h3>
            <ul className="grid grid-cols-2 gap-2 text-sm text-zinc-400 font-mono">
              <li>• React / Next.js</li>
              <li>• TypeScript</li>
              <li>• Tailwind CSS</li>
              <li>• GSAP / Framer Motion</li>
              <li>• Node.js</li>
              <li>• WebGL / 3D</li>
            </ul>
          </div>
        </div>

        <div ref={image} className="relative aspect-square w-full max-w-md mx-auto rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl">
           {/* Placeholder for Profile Image - using a gradient/pattern for now */}
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20" />
           <div className="absolute inset-0 flex items-center justify-center text-zinc-700 font-mono text-xs">
             [Profile Image Placeholder]
           </div>
        </div>
      </div>
    </div>
  );
}
