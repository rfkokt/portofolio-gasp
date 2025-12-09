"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { Post } from "@prisma/client";

interface BlogListProps {
  posts: Post[];
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
      <div className="border-t border-[#222]">
        {posts.map((post, i) => (
          <article
            key={post.id}
            className="blog-row group relative border-b border-[#222] hover:bg-[#111] transition-colors duration-300"
          >
            <Link
              href={`/blog/${post.slug}`}
              className="flex flex-col md:flex-row gap-8 py-12 items-baseline"
            >
              <div className="w-24 text-neutral-500 font-mono text-xs">
                {String(i + 1).padStart(2, "0")}
              </div>
              
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 group-hover:translate-x-4 transition-transform duration-500 ease-out">
                  {post.title}
                </h2>
                <p className="text-neutral-400 max-w-2xl leading-relaxed">
                    {post.excerpt}
                </p>
              </div>

              <div className="text-right md:w-32">
                <span className="text-xs font-mono text-neutral-600 border border-neutral-800 px-2 py-1 rounded inline-block">
                     {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
