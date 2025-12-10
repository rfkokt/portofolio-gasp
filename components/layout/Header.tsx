"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { name: "01. MISSION", path: "/#lens" },
  { name: "02. ABOUT", path: "/#about" },
  { name: "03. ARTICLES", path: "/#liquid" },
  { name: "04. CONTACT", path: "/#contact" },
];

export function Header() {
  const pathname = usePathname();
  const headerRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, path: string) => {
    if (pathname === "/" && path.startsWith("/#")) {
      e.preventDefault();
      const hash = path.replace("/", "");
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsMenuOpen(false); // Close menu on click
  };

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 w-full z-50 px-6 md:px-8 py-6 flex justify-between items-center bg-background/50 backdrop-blur-md border-b border-border transition-all duration-300"
      >
        <Link href="/" className="font-bold text-xl tracking-tighter text-foreground z-50">
          AETHER
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 uppercase text-xs font-bold text-muted-foreground items-center">
          {navItems.map((item) => (
              <Link
                  key={item.name}
                  href={item.path}
                  onClick={(e) => handleScroll(e, item.path)}
                  className="hover:text-foreground transition-colors"
              >
                  {item.name}
              </Link>
          ))}
          <ThemeToggle />
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-4 md:hidden">
            <ThemeToggle />
            <button 
                className="text-xs font-bold border border-border px-4 py-2 rounded hover:bg-foreground hover:text-background transition-colors text-foreground z-50 uppercase w-[80px]"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
            {isMenuOpen ? "CLOSE" : "MENU"}
            </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={cn(
          "fixed inset-0 bg-background z-40 flex flex-col justify-center items-center gap-8 transition-transform duration-500 md:hidden",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
          {navItems.map((item) => (
            <Link
                key={item.name}
                href={item.path}
                onClick={(e) => handleScroll(e, item.path)}
                className="text-2xl font-bold text-foreground uppercase tracking-widest hover:text-muted-foreground transition-colors"
            >
                {item.name}
            </Link>
          ))}
          <div className="absolute bottom-12">
            <ThemeToggle />
          </div>
      </div>
    </>
  );
}
