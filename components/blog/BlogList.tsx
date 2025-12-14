"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { PostRecord } from "@/lib/pb_schema";
import { fetchMorePosts } from "@/actions/blog";
import { Loader2 } from "lucide-react";

interface BlogListProps {
  posts: PostRecord[];
}

export function BlogList({ posts: initialPosts }: BlogListProps) {
  const container = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<PostRecord[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 10);

  useGSAP(
    () => {
      // Animate only the newly added items or initial items?
      // Simple approach: animate all .blog-row that are visible
      // Ideally we should target only new ones, but re-animating is acceptable for now or just rely on CSS
      const items = gsap.utils.toArray(".blog-row");
      gsap.from(items, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.05,
        ease: "power2.out",
        scrollTrigger: {
            trigger: container.current,
            start: "top 80%",
        },
        clearProps: "all" // unexpected behavior fix
      });
    },
    { scope: container, dependencies: [posts] } // Re-run when posts change
  );

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const nextPage = page + 1;
      const res = await fetchMorePosts(nextPage);
      
      if (res.success && res.items) {
        if (res.items.length > 0) {
            setPosts(prev => [...prev, ...res.items]);
            setPage(nextPage);
        }
        
        // Check if we reached the end
        if (res.page >= res.totalPages || res.items.length < 10) {
            setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

      {hasMore && (
        <div className="mt-12 text-center">
            <button 
                onClick={loadMore}
                disabled={loading}
                className="px-8 py-3 bg-foreground text-background font-bold tracking-wider hover:bg-foreground/90 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        LOADING...
                    </>
                ) : (
                    "LOAD MORE"
                )}
            </button>
        </div>
      )}
    </div>
  );
}
