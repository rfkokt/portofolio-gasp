"use client";

import { useRef, useEffect, useId } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { PostRecord } from "@/lib/pb_schema";

gsap.registerPlugin(ScrollTrigger);

interface LiquidSectionProps {
  posts: PostRecord[];
}

const ARTICLE_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200", // Original
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1200", // Gradient
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200", // Dark waves
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200", // Purple Tech
  "https://images.unsplash.com/photo-1620641788421-7f1c33b74bc4?q=80&w=1200", // Abstract
];

// Inner component for isolated liquid effect
function LiquidCard({ post, image, index }: { post: PostRecord; image: string; index: number }) {
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const filterId = useId().replace(/:/g, ""); // React 18 useId for unique ID
  
  // Independent loop for this card
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

    const card = document.getElementById(`liquid-card-${filterId}`);
    
    const onMouseEnter = () => { target = 0.02; };
    const onMouseLeave = () => { target = 0.00; };

    if (card) {
        card.addEventListener('mouseenter', onMouseEnter);
        card.addEventListener('mouseleave', onMouseLeave);
    }

    return () => {
        cancelAnimationFrame(animationFrameId);
        if (card) {
            card.removeEventListener('mouseenter', onMouseEnter);
            card.removeEventListener('mouseleave', onMouseLeave);
        }
    };
  }, [filterId]);

  return (
    <div className="flex-shrink-0 flex flex-col justify-center h-full max-w-xs md:max-w-md">
        <Link href={`/blog/${post.slug}`} id={`liquid-card-${filterId}`} className="liquid-card group cursor-pointer relative block">
            {/* SVG Filter Definition - scoped to this card */}
            <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
                <defs>
                    <filter id={`liquid-filter-${filterId}`}>
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

            <div 
                className="w-[300px] h-[400px] md:w-[400px] md:h-[500px] overflow-hidden border border-border relative mb-8"
            >
                    <div 
                    className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{
                        backgroundImage: `url('${image}')`, 
                        filter: `url(#liquid-filter-${filterId})`
                    }}
                />
                    <div className="absolute inset-0 bg-background/20 group-hover:bg-transparent transition-colors" />
                    
                    <div className="absolute top-4 right-4 bg-background/50 backdrop-blur-md px-3 py-1 border border-border rounded-full">
                    <span className="text-xs font-mono text-foreground">
                        {new Date(post.published_at || post.created).toLocaleDateString()}
                    </span>
                    </div>
            </div>
            
            <div className="space-y-4 min-h-[160px]">
                <h3 className="text-2xl md:text-3xl font-bold group-hover:text-muted-foreground transition-colors text-foreground line-clamp-2">
                    {post.title}
                </h3>
                    <div className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                    {post.excerpt}
                </div>
                <span className="text-xs font-mono uppercase text-foreground border-b border-foreground pb-1 inline-block">
                    Read Article
                </span>
            </div>
        </Link>
    </div>
  );
}

export function LiquidSection({ posts }: LiquidSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  
  // Display actual posts without duplication
  const displayPosts = posts;

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

      // Section Label Highlight (Class Toggle)
      const label = sectionRef.current?.querySelector(".section-label");
      if (label) {
        ScrollTrigger.create({
            trigger: sectionRef.current,
            start: "top center",
            end: "bottom center",
            toggleClass: { targets: label, className: "active" }
        });
      }
  }, { scope: sectionRef, dependencies: [displayPosts] });

  // Liquid effect logic MOVED to LiquidCard to be independent

  return (
    <section 
        id="liquid" 
        ref={sectionRef} 
        className="liquid-section min-h-screen relative flex items-center border-t border-border bg-background overflow-hidden"
    >
      <div className="section-label absolute top-32 left-8 z-20 text-muted-foreground">[ 03. ARTICLES ]</div>
      
      {/* Intro Text */}
      <div ref={titleRef} className="absolute left-6 md:left-20 z-10 max-w-xs md:max-w-sm pointer-events-none h-full flex flex-col justify-center top-0">
          <div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter text-foreground">
                THOUGHTS<br/>& PROCESS
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
                Scroll to explore recent articles and technical breakdowns.
            </p>
          </div>
      </div>

      {/* Scroll Container */}
      <div 
        ref={containerRef}
        className="flex gap-12 md:gap-20 items-center pl-[80vw] md:pl-[40vw] pr-[10vw] h-full relative z-30"
      >
        {displayPosts.length > 0 ? (
            displayPosts.map((post, i) => (
                <LiquidCard 
                    key={i} 
                    post={post} 
                    image={ARTICLE_IMAGES[i % ARTICLE_IMAGES.length]} 
                    index={i} 
                />
            ))
        ) : (
             <div className="flex-shrink-0 flex items-center justify-center h-full max-w-md">
                 <div className="p-8 border border-border bg-background/50 backdrop-blur-md">
                    <h3 className="text-2xl font-bold mb-4">Coming Soon</h3>
                    <p className="text-muted-foreground">
                        Articles are currently being curated. Check back later for technical breakdowns and insights.
                    </p>
                 </div>
             </div>
        )}

        {/* View All Button */}
        <div className="flex-shrink-0 flex items-center justify-center w-[200px] md:w-[300px] h-full">
            <Link 
                href="/blog" 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-border bg-background flex items-center justify-center hover:bg-foreground hover:text-background transition-all duration-300 font-bold tracking-widest text-xs uppercase text-foreground"
            >
                View Archive
            </Link>
        </div>

      </div>
    </section>
  );
}
