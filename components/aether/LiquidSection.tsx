"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import Link from "next/link";
import { Post } from "@prisma/client";

interface LiquidSectionProps {
  posts: Post[];
}

export function LiquidSection({ posts }: LiquidSectionProps) {
  const featuredPost = posts[0]; // Use the latest post for the effect
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let val = 0.00;
    let target = 0.00;
    let animationFrameId: number;

    const loopLiquid = () => {
       val += (target - val) * 0.05;
       if (turbulenceRef.current) {
           turbulenceRef.current.setAttribute("baseFrequency", `${val} ${val}`);
       }
       animationFrameId = requestAnimationFrame(loopLiquid);
    };

    loopLiquid();

    const onMouseEnter = () => { target = 0.03; };
    const onMouseLeave = () => { target = 0.00; };

    const el = containerRef.current;
    if (el) {
        el.addEventListener("mouseenter", onMouseEnter);
        el.addEventListener("mouseleave", onMouseLeave);
    }

    return () => {
        cancelAnimationFrame(animationFrameId);
        if (el) {
            el.removeEventListener("mouseenter", onMouseEnter);
            el.removeEventListener("mouseleave", onMouseLeave);
        }
    };
  }, []);

  if (!featuredPost) return null;

  return (
    <section id="liquid" className="liquid-section min-h-screen relative flex items-center justify-center border-t border-[#222] overflow-hidden">
      <div className="section-label">[ 03. SVG TURBULENCE ]</div>
      
      {/* SVG Filter Definition */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter id="liquid-filter">
            <feTurbulence 
                ref={turbulenceRef} 
                type="fractalNoise" 
                baseFrequency="0.0" 
                numOctaves="2" 
                result="noise" 
            />
            <feDisplacementMap 
                in="SourceGraphic" 
                in2="noise" 
                scale="30" 
                xChannelSelector="R" 
                yChannelSelector="G" 
            />
          </filter>
        </defs>
      </svg>

      <div className="flex flex-col md:flex-row gap-20 items-center justify-center w-full px-6 max-w-7xl mx-auto">
        
        {/* Text Content */}
        <div className="text-right max-w-sm order-2 md:order-1 z-10 pointer-events-none mix-blend-difference">
          <Link href={`/blog/${featuredPost.slug}`} className="pointer-events-auto block group">
              <h2 className="text-6xl font-bold mb-6 tracking-tighter group-hover:text-neutral-400 transition-colors">
                LATEST<br/>THOUGHTS
              </h2>
              <div className="text-neutral-400 text-sm leading-relaxed mb-4">
                <span className="block text-white font-bold mb-2">{featuredPost.title}</span>
                {featuredPost.excerpt}
              </div>
              <span className="text-xs font-mono uppercase border border-white/20 px-2 py-1 rounded inline-block">
                Read Article
              </span>
          </Link>
          
          <div className="mt-12 space-y-4">
             <Link href="/blog" className="text-xs font-bold pointer-events-auto hover:text-white text-neutral-500">
                VIEW ARCHIVE
             </Link>
          </div>
        </div>

        {/* Liquid Image Trigger */}
        <div 
            ref={containerRef} 
            className="liquid-container relative w-[500px] h-[600px] overflow-hidden border border-[#333] order-1 md:order-2 group cursor-pointer"
        >
          {/* Placeholder or Featured Image */}
          <div 
            className="liquid-img w-full h-full bg-cover bg-center transform scale-110 transition-transform duration-700 group-hover:scale-105"
            style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=1200&auto=format&fit=crop')`,
                filter: "url('#liquid-filter')"
            }}
          />
          <div className="liquid-overlay absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay">
             <h3 className="text-9xl font-black text-white opacity-20 tracking-tighter">FLUX</h3>
          </div>
        </div>

      </div>
    </section>
  );
}
