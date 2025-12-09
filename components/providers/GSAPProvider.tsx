"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export function GSAPProvider({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    // Register any extra plugins here in the future
    // gsap.registerPlugin(ScrollTrigger);
  }, []);

  return <>{children}</>;
}
