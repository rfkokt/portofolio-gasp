"use client";

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LucideIcon, Mail, Twitter, Linkedin, MessageSquare } from "lucide-react";

export function ContactSection() {
  const container = useRef<HTMLElement>(null);

  const [showScroll, setShowScroll] = useState(false);

  useGSAP(() => {
    // ... existing GSAP code ...
    const label = container.current?.querySelector(".section-label");
    if (label) {
        // Simple toggle class for active state
        ScrollTrigger.create({
            trigger: container.current,
            start: "top center",
            end: "bottom center",
            toggleClass: { targets: label, className: "active" }
        });
    }
  }, { scope: container });

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.scrollY > 400) {
        setShowScroll(true);
      } else if (showScroll && window.scrollY <= 400) {
        setShowScroll(false);
      }
    };

    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, [showScroll]);

  return (
    <section id="contact" ref={container} className="min-h-[50vh] flex flex-col items-center justify-center relative border-t border-border bg-background">
      <div className="section-label absolute top-12 left-8 z-20 text-muted-foreground">[ 04. CONTACT ]</div>

      <div className="items-center flex flex-col z-10 p-8 max-w-2xl text-center">
            <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter text-foreground">
                LET'S BUILD<br/>THE FUTURE
            </h2>
            <p className="text-muted-foreground mb-10 max-w-md leading-relaxed">
                Open for collaborations, freelance projects, or just a chat about code and design.
            </p>

            <div className="flex flex-col gap-6 w-full max-w-sm">
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold mb-2 text-foreground">Also follow me on other social media!</h3>
                <div className="grid grid-cols-2 gap-4">
                      {/* Email */}
                      <a href="mailto:contact@rdev.cloud" className="bg-foreground/5 hover:bg-foreground/10 border border-border transition-colors text-foreground py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                          EMAIL
                      </a>
                      
                      {/* GitHub */}
                      <a href="#" className="bg-foreground/5 hover:bg-foreground/10 border border-border transition-colors text-foreground py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold">
                          GITHUB
                      </a>
                </div>
                </div>
            </div>
      </div>

      {/* Footer / Copyright */}
      <footer className="absolute bottom-6 flex justify-between w-full px-8 text-[10px] uppercase font-mono text-muted-foreground tracking-widest opacity-80">
          <span>© 2024 RDEV • PORTFOLIO</span>
          <span>JAKARTA, ID</span>
      </footer>
      
       {/* Scroll to Top - Floating Fixed */}
       <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-6 z-50 bg-background/80 backdrop-blur-md border border-border text-foreground px-6 py-3 rounded-full flex items-center gap-2 text-xs font-bold hover:bg-foreground hover:text-background transition-all duration-300 shadow-lg hover:-translate-y-1 ${showScroll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
       >
            BACK TO TOP
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
       </button>
    </section>
  );
}
