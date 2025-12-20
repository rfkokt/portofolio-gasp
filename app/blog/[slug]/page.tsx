import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { FloatingActionBar } from "@/components/blog/FloatingActionBar";
import { CodeBlock } from "@/components/blog/CodeBlock";
import { getPostBySlug, getRelatedPosts } from "@/lib/pocketbase";

interface BlogPostPageProps {
    params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  
  // Parallel data fetching
  const [post, relatedPostsResult] = await Promise.all([
      getPostBySlug(slug).catch(() => null),
      getRelatedPosts(slug).catch(() => ({ items: [] }))
  ]);

  if (!post) {
      notFound();
  }

  const relatedPosts = relatedPostsResult.items.slice(0, 2);

  const isPromo = post.tags?.some((tag: string) => ['Deal', 'Promo', 'Game', 'Free', 'Offer'].includes(tag));
  const isVerified = post.tags?.includes('Verified');

  if (isPromo) {
    return (
        <article className="min-h-screen bg-background pt-24 pb-20">
            {/* Promo Header */}
            <header className="bg-muted/30 pb-20 pt-10 border-b border-border">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <Link 
                        href="/blog" 
                        className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground mb-8 hover:text-primary transition-colors border border-border px-3 py-1 rounded-full bg-background"
                    >
                        ← BACK TO DEALS
                    </Link>
                    
                    <div className="flex justify-center items-center gap-3 mb-6">
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-widest uppercase animate-pulse">
                            Active Promo
                        </span>
                        {isVerified && (
                             <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-widest uppercase">
                                Verified
                            </span>
                        )}
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                            {new Date(post.published_at || post.created).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-tight mb-8 max-w-4xl mx-auto">
                        {post.title}
                    </h1>

                    {post.cover_image && (
                         <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl border border-border/50 group">
                            <img 
                                src={post.cover_image} 
                                alt={post.title}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                            <div className="absolute bottom-4 left-4 right-4 text-white text-xs font-mono opacity-80">
                                Image source: External
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Mobile Floating Bar (Fixed at bottom) */}
            <FloatingActionBar 
                postId={post.id} 
                slug={post.slug} 
                title={post.title} 
                variant="fixed"
                className="lg:hidden"
            />

            <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
                 <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
                    {/* Main Content */}
                    <main className="bg-background rounded-2xl p-6 md:p-10 shadow-sm border border-border/50 min-w-0">
                         <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">
                            <ReactMarkdown 
                                rehypePlugins={[rehypeHighlight, rehypeSlug]}
                                components={{
                                    pre: ({ children, ...props }) => <CodeBlock {...props}>{children}</CodeBlock>
                                }}
                            >
                                {post.content}
                            </ReactMarkdown>
                        </div>
                    </main>

                    {/* Sidebar Info */}
                    <aside className="space-y-6">
                        <div className="sticky top-32 space-y-6">
                            <div className="bg-background border border-border p-6 rounded-xl shadow-sm">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Deal Status
                                </h3>
                                <div className="space-y-4 text-sm text-muted-foreground">
                                    <div className="flex justify-between border-b border-border/50 pb-2">
                                        <span>Verified</span>
                                        <span className={`font-mono font-bold ${isVerified ? "text-green-600" : "text-yellow-600"}`}>
                                            {isVerified ? "YES ✅" : "Checking ⏳"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-border/50 pb-2">
                                        <span>Type</span>
                                        <span className="text-foreground">{post.tags?.slice(0, 1).join(', ') || 'Promo'}</span>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-xs italic opacity-70">
                                            "Always check the landing page for official expiry dates."
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <FloatingActionBar 
                                postId={post.id} 
                                slug={post.slug} 
                                title={post.title} 
                                variant="inline"
                                className="shadow-none border-0 bg-muted/20 hidden lg:flex"
                            />
                        </div>
                    </aside>
                 </div>
            </div>
             
             {/* Related Deals */}
            {relatedPosts.length > 0 && (
                <div className="max-w-7xl mx-auto px-6 mt-20">
                     <h2 className="text-2xl font-bold mb-8">Related Deals</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {relatedPosts.map((related) => (
                             <Link key={related.id} href={`/blog/${related.slug}`} className="group relative block aspect-video rounded-xl overflow-hidden bg-muted">
                                {related.cover_image ? (
                                    <img src={related.cover_image} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                <div className="absolute bottom-0 left-0 p-4">
                                     <h3 className="text-white font-bold leading-tight group-hover:underline">{related.title}</h3>
                                </div>
                             </Link>
                        ))}
                     </div>
                </div>
            )}
        </article>
    );
  }

  // STANDARD LAYOUT (Existing Code)
  return (
    <article className="min-h-screen bg-background pt-32 pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground mb-12 hover:text-foreground transition-colors"
        >
            ← BACK TO JOURNAL
        </Link>
        
        <header className="mb-20 pb-12 border-b border-border">
            <div className="flex justify-between items-start mb-6">
                 <div className="flex gap-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    <span>
                        {new Date(post.published_at || post.created).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                    <span>//</span>
                    <span>Article</span>
                </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter leading-tight mb-8">
                {post.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                {post.excerpt}
            </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-12 max-w-6xl mx-auto">
            <main className="min-w-0">
                {/* Standard Post Image if available */}
                {post.cover_image && (
                     <figure className="mb-12 rounded-xl overflow-hidden aspect-[21/9] bg-muted relative">
                        <img 
                            src={post.cover_image} 
                            alt={post.title}
                            className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                        />
                     </figure>
                )}

                <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-24 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-code:text-foreground prose-pre:bg-muted/50">
                    <ReactMarkdown 
                        rehypePlugins={[rehypeHighlight, rehypeSlug]}
                        components={{
                            a: ({ href, children }) => (
                                <a 
                                    href={href} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-foreground border-b border-muted-foreground/30 transition-all hover:bg-foreground hover:text-background hover:border-transparent"
                                >
                                    {children}
                                </a>
                            ),
                            pre: ({ children, ...props }) => (
                                <CodeBlock {...props}>
                                    {children}
                                </CodeBlock>
                            )
                        }}
                    >
                        {post.content}
                    </ReactMarkdown>
                </div>
            </main>
            
            <aside className="hidden lg:block">
                <div className="sticky top-32">
                    <TableOfContents content={post.content} />
                </div>
            </aside>
        </div>

        {/* Separator */}
        <div className="my-20 border-t border-border max-w-4xl mx-auto" />

        {/* RELATED ARTICLES */}
        {relatedPosts.length > 0 && (
            <footer className="pt-10 max-w-4xl mx-auto">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-10">
                    Read Next
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {relatedPosts.map((related) => (
                        <Link key={related.id} href={`/blog/${related.slug}`} className="group block">
                            <article className="h-full border border-border p-6 rounded-lg hover:bg-foreground/5 transition-colors">
                                <h4 className="text-xl font-bold mb-3 group-hover:text-foreground transition-colors">
                                    {related.title}
                                </h4>
                                <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed mb-4">
                                    {related.excerpt}
                                </p>
                                <span className="text-xs font-mono text-muted-foreground">
                                    Read Article →
                                </span>
                            </article>
                        </Link>
                    ))}
                </div>
            </footer>
        )}

        <FloatingActionBar 
            postId={post.id} 
            slug={post.slug} 
            title={post.title} 
        />

      </div>
    </article>
  );
}
