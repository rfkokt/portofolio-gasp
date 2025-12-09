"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { Post } from "@prisma/client";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface BlogPreviewProps {
  posts: Post[];
}

export function BlogPreview({ posts }: BlogPreviewProps) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray(".blog-item-home");
      gsap.from(items, {
        scrollTrigger: {
            trigger: container.current,
            start: "top 75%",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out"
      });
    },
    { scope: container }
  );

  return (
    <section id="blog" ref={container} className="py-32 px-6 container mx-auto bg-white/2">
      <div className="flex items-center justify-between mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
             Latest <span className="text-primary">Thoughts</span>
          </h2>
          <Link href="/blog" className="hidden md:flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">
            Read All Articles
             <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                <path d="M2.5 9.5L9.5 2.5M9.5 2.5H3.5M9.5 2.5V8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
      </div>

      <div className="divide-y divide-white/10">
        {posts.map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.id} className="blog-item-home group block py-8">
            <article className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 uppercase tracking-wider">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span>Development</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-zinc-400 line-clamp-2 md:hidden">{post.excerpt}</p>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-600 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 duration-300">
                    Read Article
                     <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 9.5L9.5 2.5M9.5 2.5H3.5M9.5 2.5V8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </article>
          </Link>
        ))}
      </div>

       <div className="mt-12 text-center md:hidden">
         <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">
            Read All Articles
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                <path d="M2.5 9.5L9.5 2.5M9.5 2.5H3.5M9.5 2.5V8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
      </div>
    </section>
  );
}
