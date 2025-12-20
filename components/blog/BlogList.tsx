"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { PostRecord } from "@/lib/pb_schema";
import { fetchMorePosts } from "@/actions/blog";
import { Loader2, Search } from "lucide-react";

// ... existing imports
import { BlogCategoryList } from "./BlogCategoryList";

interface BlogListProps {
  posts: PostRecord[];
  totalPosts: number;
}

// ... existing imports

export function BlogList({ posts: initialPosts, totalPosts }: BlogListProps) {
  const container = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<PostRecord[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length < totalPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const prevPostsCount = useRef(0);

  const handleCategorySelect = (tag: string) => {
    // If clicking the same tag, clear filter (toggle). Else set filter.
    const newQuery = searchQuery === tag ? "" : tag;
    setSearchQuery(newQuery);
    performSearch(newQuery);
  };
  
  // ... GSAP and existing logic ...

  useGSAP(
    // ... existing GSAP logic
    () => {
      const allItems = gsap.utils.toArray<HTMLElement>(".blog-row");
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
    // ... existing performSearch logic
    setLoading(true);
    try {
        const res = await fetchMorePosts(1, query); 
        if (res.success && res.items) {
            setPosts(res.items);
            setPage(1);
            setHasMore(res.page < res.totalPages);
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
    // ... existing handleSearchChange
    const query = e.target.value;
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
        performSearch(query);
    }, 500);
  };

  const loadMore = async () => {
    // ... existing loadMore
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
        setHasMore(res.page < res.totalPages);
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
      
      {/* Top Categories Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-foreground">Explore Top Categories</h2>
           <p className="text-muted-foreground mt-1">Menjelajahi kategori terbaik</p>
        </div>

        <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-border/60 rounded-full bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all text-sm"
                placeholder="Cari kategori yang menarik bagi Anda."
                value={searchQuery}
                onChange={handleSearchChange}
            />
        </div>
      </div>

      {/* Categories List */}
      <BlogCategoryList onSelectCategory={handleCategorySelect} activeCategory={searchQuery} />

      <div className="border-t border-border mt-10">
        {posts.length === 0 && !loading && (
            <div className="py-20 text-center text-muted-foreground">
                No posts found matching your search.
            </div>
        )}

        {posts.map((post, i) => {
            const isDeal = post.tags?.some(tag => ['Deal', 'Promo', 'Game', 'Free', 'Offer'].includes(tag));
            const isStory = post.tags?.some(tag => ['Story', 'Indie Hacker', 'Success', 'Motivation'].includes(tag));
            const showAsBigCard = isDeal || isStory;

            const dateStr = new Date(post.published_at || post.created).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            if (showAsBigCard) {
                return (
                    <article
                        key={post.id}
                        className="blog-row group relative border-b border-border hover:bg-muted/30 transition-colors duration-300"
                    >
                        <Link href={`/blog/${post.slug}`} className="block p-6 md:py-10">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Thumbnail */}
                                <div className="w-full md:w-80 shrink-0 aspect-video relative rounded-xl overflow-hidden border border-border/50 shadow-sm group-hover:shadow-md transition-all">
                                    {post.cover_image ? (
                                        <img 
                                            src={post.cover_image} 
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                                            No Image
                                        </div>
                                    )}
                                    <div className={`absolute top-3 left-3 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm ${isStory ? "bg-indigo-600" : "bg-red-500"}`}>
                                        {isStory ? "STORY" : "PROMO"}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col h-full justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                                            <span className="font-mono">{dateStr}</span>
                                            {post.tags?.slice(0, 3).map(tag => (
                                                <span key={tag} className="px-2 py-0.5 border border-border rounded-full bg-background/50">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight group-hover:text-primary transition-colors">
                                            {post.title}
                                        </h2>
                                        <p className="text-muted-foreground line-clamp-2 md:line-clamp-3 leading-relaxed">
                                            {post.excerpt}
                                        </p>
                                    </div>
                                    
                                    <div className="mt-4 flex items-center text-sm font-medium text-foreground ">
                                        <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                                            {isStory ? "Read Story" : "Check Deal"}
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </article>
                );
            }

            // STANDARD POST LAYOUT
            return (
            <article
              key={post.id}
              className="blog-row group relative border-b border-border hover:bg-foreground/5 transition-colors duration-300"
            >
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="flex flex-col-reverse md:flex-row gap-6 md:gap-10 py-10 items-start">
                    
                    {/* Index Number (Desktop only) */}
                    <div className="md:w-16 text-muted-foreground font-mono text-xs pt-1 hidden md:block border-t border-transparent group-hover:border-foreground/20 transition-colors">
                        {String(i + 1).padStart(2, "0")}
                    </div>
                    
                    {/* Content Section */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-3 mb-3 items-center">
                            <span className="text-xs font-mono text-muted-foreground">{dateStr}</span>
                            {/* Optional: Show 1 tag for standard posts too if available */}
                            {post.tags?.[0] && !['Deal','Promo'].includes(post.tags[0]) && (
                                <span className="text-[10px] uppercase tracking-wider border border-border px-1.5 py-0.5 rounded text-muted-foreground">
                                    {post.tags[0]}
                                </span>
                            )}
                        </div>

                        <h2 className="text-3xl md:text-3xl font-bold text-foreground mb-4 group-hover:translate-x-0 transition-all leading-tight">
                        {post.title}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed line-clamp-2 md:line-clamp-3 group-hover:text-foreground/80 transition-colors">
                            {post.excerpt}
                        </p>
                    </div>

                    {/* Right Side Image (Distinct from Deals) */}
                    {/* Style: Grayscale by default, Color on hover. Smaller, specific aspect ratio. */}
                    {post.cover_image && (
                        <div className="w-full md:w-56 shrink-0 aspect-video md:aspect-[4/3] rounded-lg overflow-hidden bg-muted relative self-center mb-4 md:mb-0 group-hover:-translate-y-1 transition-transform duration-500 will-change-transform">
                            <img 
                                src={post.cover_image} 
                                alt={post.title}
                                className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700 ease-out bg-blend-luminosity"
                            />
                        </div>
                    )}
                </div>
              </Link>
            </article>
            );
        })}
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
