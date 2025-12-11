"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { PostRecord } from "@/lib/pb_schema";

interface BlogListProps {
  posts: PostRecord[];
}

export function BlogList({ posts }: BlogListProps) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".blog-row", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.05,
        ease: "power2.out",
        scrollTrigger: {
            trigger: container.current,
            start: "top 80%",
        }
      });
    },
    { scope: container }
  );

  return (
    <div ref={container} className="max-w-7xl mx-auto px-6 mb-20">
      <div className="border-t border-border">
        {posts.map((post, i) => (
            <article
              key={post.id}
              className="blog-row group relative border-b border-border hover:bg-foreground/5 transition-colors duration-300"
            >
              <div className="flex flex-col md:flex-row gap-8 py-12 items-baseline">
                <div className="w-24 text-muted-foreground font-mono text-xs">
                  {String(i + 1).padStart(2, "0")}
                </div>
                
                <div className="flex-1">
                  <Link href={`/blog/${post.slug}`} className="block group/link">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 group-hover:translate-x-4 transition-transform duration-500 ease-out">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground max-w-2xl leading-relaxed group-hover/link:text-foreground transition-colors">
                        {post.excerpt}
                    </p>
                  </Link>
                </div>

                <div className="text-right md:w-32 flex flex-col items-end gap-4">
                  <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-1 rounded inline-block">
                       {new Date(post.published_at || post.created).toLocaleDateString('en-US', {
                           year: 'numeric',
                           month: 'long',
                           day: 'numeric'
                       })}
                  </span>
                </div>
              </div>
            </article>
        ))}
      </div>
    </div>
  );
}
