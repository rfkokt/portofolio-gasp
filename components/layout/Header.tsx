"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRef } from "react";

const navItems = [
  { name: "01. MISSION", path: "/#lens" },
  { name: "02. ABOUT", path: "/#about" },
  { name: "03. ARTICLES", path: "/#liquid" },
  { name: "04. CONTACT", path: "/#contact" },
];

export function Header() {
  const pathname = usePathname();
  const headerRef = useRef(null);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, path: string) => {
    if (pathname === "/" && path.startsWith("/#")) {
      e.preventDefault();
      const hash = path.replace("/", "");
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header
      ref={headerRef}
      className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/5 transition-all duration-300"
    >
      <Link href="/" className="font-bold text-xl tracking-tighter text-white">
        AETHER
      </Link>

      <nav className="hidden md:flex gap-6 uppercase text-xs font-bold text-neutral-500">
        {navItems.map((item) => (
            <Link
                key={item.name}
                href={item.path}
                onClick={(e) => handleScroll(e, item.path)}
                className="hover:text-white transition-colors"
            >
                {item.name}
            </Link>
        ))}
      </nav>

      <button className="text-xs font-bold border border-white/20 px-4 py-2 rounded hover:bg-white hover:text-black transition-colors text-white">
        MENU
      </button>
    </header>
  );
}
