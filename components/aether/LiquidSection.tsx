"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { Post } from "@prisma/client";

gsap.registerPlugin(ScrollTrigger);

interface LiquidSectionProps {
  posts: Post[];
}

export function LiquidSection({ posts }: LiquidSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  
  // Create multiple dummy posts if we don't have enough to demonstrate scrolling
  const displayPosts = posts.length > 0 ? [...posts, ...posts, ...posts].slice(0, 5) : [];

  useGSAP(() => {
    if (!sectionRef.current || !containerRef.current) return;

    // Force strict layout for pinning context
    gsap.set(sectionRef.current, { 
        height: "100vh", 
        width: "100%",
        overflow: "hidden", 
        position: "relative" 
    });
    
    // Calculate precise scroll distance
    const getScrollLength = () => {
        if (!containerRef.current) return 0;
        return containerRef.current.scrollWidth - window.innerWidth;
    };

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: sectionRef.current,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            end: () => `+=${getScrollLength()}`, 
            anticipatePin: 1,
        }
    });

    tl.to(containerRef.current, {
        x: () => -getScrollLength(),
        ease: "none",
    });

    // Parallax Title - Moves up faster than scroll
    if (titleRef.current) {
        gsap.set(titleRef.current, { zIndex: 10 }); // Ensure it's below scroll content
        
        gsap.to(titleRef.current, {
            y: -200,
            opacity: 0,
            ease: "none",
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top top",
                end: "top+=300 top", // Fade out early
                scrub: true
            }
        });
    }

    // Section Label Highlight
    const labels = sectionRef.current?.querySelectorAll(".section-label");
    labels?.forEach(label => {
        gsap.fromTo(label, 
            { color: "#666", borderColor: "#222" },
            { 
                color: "#fff", 
                borderColor: "rgba(255,255,255,0.5)",
                duration: 0.5,
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top center",
                    end: "bottom center",
                    toggleActions: "play reverse play reverse",
                }
            }
        );
    });

    return () => {
        tl.kill();
    };
  }, { scope: sectionRef, dependencies: [displayPosts] });

  // Liquid effect logic (reused)
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

    const onMouseEnter = () => { target = 0.02; };
    const onMouseLeave = () => { target = 0.00; };

    const cards = document.querySelectorAll('.liquid-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', onMouseEnter);
        card.addEventListener('mouseleave', onMouseLeave);
    });

    return () => {
        cancelAnimationFrame(animationFrameId);
        cards.forEach(card => {
            card.removeEventListener('mouseenter', onMouseEnter);
            card.removeEventListener('mouseleave', onMouseLeave);
        });
    };
  }, [displayPosts]);

  if (displayPosts.length === 0) return null;

  return (
    <section 
        id="liquid" 
        ref={sectionRef} 
        className="liquid-section min-h-screen relative flex items-center border-t border-[#222] bg-black overflow-hidden"
    >
      <div className="section-label fixed top-32 left-8 z-20 mix-blend-difference">[ 03. ARTICLES ]</div>
      
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

      {/* Intro Text */}
      <div ref={titleRef} className="absolute left-6 md:left-20 z-10 max-w-xs md:max-w-sm pointer-events-none">
          <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter text-white mix-blend-difference">
            THOUGHTS<br/>& PROCESS
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed mix-blend-difference">
            Scroll to explore recent articles and technical breakdowns.
          </p>
      </div>

      {/* Scroll Container */}
      <div 
        ref={containerRef}
        className="flex gap-12 md:gap-20 items-center pl-[80vw] md:pl-[40vw] pr-[10vw] h-full relative z-30"
      >
        {displayPosts.map((post, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col justify-center h-full max-w-xs md:max-w-md">
                <Link href={`/blog/${post.slug}`} className="liquid-card group cursor-pointer relative block">
                    <div 
                        className="w-[300px] h-[400px] md:w-[400px] md:h-[500px] overflow-hidden border border-[#333] relative mb-8"
                    >
                         <div 
                            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{
                                backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200' )`, 
                                filter: "url('#liquid-filter')"
                            }}
                        />
                         <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                         
                         <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 border border-white/10 rounded-full">
                            <span className="text-xs font-mono text-white">
                                {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                         </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-2xl md:text-3xl font-bold group-hover:text-neutral-400 transition-colors text-white">
                            {post.title}
                        </h3>
                         <div className="text-neutral-400 text-sm leading-relaxed line-clamp-3">
                            {post.excerpt}
                        </div>
                        <span className="text-xs font-mono uppercase text-white border-b border-white pb-1 inline-block">
                            Read Article
                        </span>
                    </div>
                </Link>
            </div>
        ))}

        {/* View All Button */}
        <div className="flex-shrink-0 flex items-center justify-center w-[200px] md:w-[300px] h-full">
            <Link 
                href="/blog" 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-white/20 bg-black flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 font-bold tracking-widest text-xs uppercase text-white"
            >
                View Archive
            </Link>
        </div>

      </div>
    </section>
  );
}
