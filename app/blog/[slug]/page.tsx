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
