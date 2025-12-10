"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useGSAP(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const xTo = gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3.out" });

    const widthTo = gsap.quickTo(cursor, "width", { duration: 0.3, ease: "power3.out" });
    const heightTo = gsap.quickTo(cursor, "height", { duration: 0.3, ease: "power3.out" });

    const handleMouseMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);

      const target = e.target as HTMLElement;
      
      // Check if we are in the 'about' section
      const isAboutSection = target.closest("#about");
      
      if (isAboutSection) {
        setIsVisible(true);
        
        // Interaction states
        if (getComputedStyle(isAboutSection).cursor === 'none' || target.closest('a') || target.closest('button')) {
             // Maybe scale up or down? For now just keep it visible
             widthTo(48); // Slightly larger on interactables if we wanted
             heightTo(48);
        } else {
             widthTo(32);
             heightTo(32);
        }

      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`hidden md:block fixed top-0 left-0 w-8 h-8 bg-white/90 rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 mix-blend-difference transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ willChange: "transform, width, height" }}
    />
  );
}
