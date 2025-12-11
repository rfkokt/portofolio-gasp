import { getPostBySlug, getPostSlugs } from "@/lib/pocketbase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShareButton } from "@/components/aether/ShareButton";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const posts = await getPostSlugs();
    return posts.map((post) => ({ slug: post.slug }));
  } catch (error) {
    console.warn("PocketBase not available at build time, skipping static generation for blog posts.");
    return [];
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  
  let post;
  try {
      post = await getPostBySlug(slug);
  } catch (e) {
      notFound();
  }

  return (
    <article className="min-h-screen bg-background pt-32 pb-20 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6">
        <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground mb-12 hover:text-foreground transition-colors"
        >
            ← BACK TO JOURNAL
        </Link>
        
        <header className="mb-20 pb-12 border-b border-border">
            <div className="flex justify-between items-start mb-6">
                 <div className="flex gap-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    <span>{new Date(post.created).toLocaleDateString()}</span>
                    <span>//</span>
                    {/* View count removed as it requires custom implementation in PB */}
                    <span>Article</span>
                </div>
                <ShareButton title={post.title} text={post.excerpt} />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter mb-8 leading-none">
                {post.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                {post.excerpt}
            </p>
        </header>

        <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-li:text-muted-foreground">
            {/* Simple rendering for now, can be upgraded to Markdown component later */}
            <div className="whitespace-pre-wrap font-sans text-foreground/90" dangerouslySetInnerHTML={{ __html: post.content }}>
            </div>
        </div>
      </div>
    </article>
  );
}
