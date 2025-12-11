"use client";

import { useEffect, useState } from "react";
import GithubSlugger from "github-slugger";
import Link from "next/link";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ content }: { content: string }) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const slugger = new GithubSlugger();
    const regex = /^(#{1,6})\s+(.+)$/gm;
    const extractedHeadings: TOCItem[] = [];
    
    let match;
    while ((match = regex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = slugger.slug(text);
      
      // Only include h2 and h3
      if (level >= 2 && level <= 3) {
          extractedHeadings.push({ id, text, level });
      }
    }
    
    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
      const observer = new IntersectionObserver(
          (entries) => {
              entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                      setActiveId(entry.target.id);
                  }
              });
          },
          { rootMargin: "0px 0px -80% 0px" }
      );

      headings.forEach(({ id }) => {
          const element = document.getElementById(id);
          if (element) observer.observe(element);
      });

      return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-4 font-sans text-sm">
      <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
        Table of Contents
      </h3>
      <ul className="space-y-3">
        {headings.map((heading) => (
          <li 
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 2) * 16}px` }}
          >
            <Link
              href={`#${heading.id}`}
              className={`block transition-colors duration-200 border-l-2 pl-4 -ml-px ${
                activeId === heading.id
                  ? "border-foreground text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
              }`}
              onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(heading.id)?.scrollIntoView({
                      behavior: "smooth"
                  });
              }}
            >
              {heading.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
