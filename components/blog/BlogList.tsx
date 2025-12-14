"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { PostRecord } from "@/lib/pb_schema";
import { fetchMorePosts } from "@/actions/blog";
import { Loader2, Search } from "lucide-react";

interface BlogListProps {
  posts: PostRecord[];
}

export function BlogList({ posts: initialPosts }: BlogListProps) {
  const container = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<PostRecord[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 10);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const prevPostsCount = useRef(0);

  // Reset prevPostsCount when posts is reset (e.g. new search)
  // If we replace all posts, we want animation to run on all of them, or just reset?
  // If page resets to 1, effectively we are showing new set.
  // We can reset prevPostsCount to 0 when page is 1.

  useGSAP(
    () => {
      const allItems = gsap.utils.toArray<HTMLElement>(".blog-row");
      
      // If page is 1, we might have reset the list. Animate all.
      const startIndex = page === 1 ? 0 : prevPostsCount.current;
      const newItems = allItems.slice(startIndex);
      
      if (newItems.length > 0) {
        gsap.from(newItems, {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.05,
            ease: "power2.out",
            scrollTrigger: {
                trigger: newItems[0],
            },
            clearProps: "all"
        });
      }
      
      prevPostsCount.current = allItems.length;
    },
    { scope: container, dependencies: [posts] }
  );

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
        const res = await fetchMorePosts(1, query); // Page 1
        if (res.success && res.items) {
            setPosts(res.items);
            setPage(1);
            setHasMore(res.items.length >= 10); // Logic: if < 10 returned, no more pages likely (simple check)
            // Or better: res.page >= res.totalPages logic if available.
            // Using length check is robust enough for simple pagination.
            if (res.items.length < 10) setHasMore(false);
        } else {
            setPosts([]);
            setHasMore(false);
        }
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
        performSearch(query);
    }, 500);
  };

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const nextPage = page + 1;
      const res = await fetchMorePosts(nextPage, searchQuery);
      
      if (res.success && res.items) {
        if (res.items.length > 0) {
            setPosts(prev => [...prev, ...res.items]);
            setPage(nextPage);
        }
        
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
      
      {/* Search Bar */}
      <div className="mb-12 relative max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
            type="text"
            className="block w-full pl-10 pr-3 py-4 border border-border rounded-none bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={handleSearchChange}
        />
      </div>

      <div className="border-t border-border">
        {posts.length === 0 && !loading && (
            <div className="py-20 text-center text-muted-foreground">
                No posts found matching your search.
            </div>
        )}

        {posts.map((post, i) => (
            <article
              key={post.id}
              className="blog-row group relative border-b border-border hover:bg-foreground/5 transition-colors duration-300"
            >
              <div className="flex flex-col md:flex-row gap-8 py-12 items-baseline">
                <div className="w-24 text-muted-foreground font-mono text-xs">
                  {/* Keep sequential numbering even with search? match original index logic? 
                      Original logic: i + 1. It resets on search which is fine. */}
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
