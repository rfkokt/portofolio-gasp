"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { CodeBlock } from "@/components/blog/CodeBlock";
import { AlertTriangle, X } from "lucide-react";
import { getPreviewPost } from "@/actions/preview";

interface PreviewPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image?: string;
  tags?: string[];
  published_at?: string;
}

function BlogPreviewContent() {
  const [post, setPost] = useState<PreviewPost | null>(null);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();
  const postId = searchParams.get('id');

  useEffect(() => {
    const loadPreview = async () => {
      // 1. If ID is present in URL, fetch from PocketBase (via Server Action)
      if (postId) {
        try {
          const record = await getPreviewPost(postId);
          setPost(record as unknown as PreviewPost);
        } catch (err: any) {
             setError(`Failed to load draft: ${err.message}`);
        }
        return;
      }

      // 2. Fallback: Read preview data from localStorage (for Editor preview)
      const previewData = localStorage.getItem("blog_preview");
      if (previewData) {
        try {
          setPost(JSON.parse(previewData));
        } catch {
          setError("Failed to load preview data");
        }
      } else {
        setError("No preview data found. Please open preview from the editor.");
      }
    };

    loadPreview();
  }, [postId]);

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Preview Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link 
            href="/cms/posts" 
            className="px-6 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wider"
          >
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading preview...</div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-background pt-32 pb-20 transition-colors duration-300">
      {/* Preview Banner */}
      <div className="fixed top-20 left-0 right-0 bg-yellow-500 text-black py-2 px-4 z-40 flex items-center justify-center gap-4">
        <AlertTriangle className="w-4 h-4" />
        <span className="font-bold text-sm uppercase tracking-wider">Preview Mode</span>
        <span className="text-sm">This is how your post will look when published</span>
        <button
          onClick={() => window.close()}
          className="ml-4 p-1 hover:bg-black/10 rounded"
          title="Close Preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10">
        <Link 
            href="/cms/posts" 
            className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground mb-12 hover:text-foreground transition-colors"
        >
            ← BACK TO EDITOR
        </Link>
        
        <header className="mb-20 pb-12 border-b border-border">
            <div className="flex justify-between items-start mb-6">
                 <div className="flex gap-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    <span>
                        {new Date(post.published_at || Date.now()).toLocaleDateString('en-US', {
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
      </div>
    </article>
  );
}

export default function BlogPreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background pt-32 pb-20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading preview environment...</div>
      </div>
    }>
      <BlogPreviewContent />
    </Suspense>
  );
}
