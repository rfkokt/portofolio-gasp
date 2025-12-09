import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({ select: { slug: true } });
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
  });

  if (!post) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-[#050505] pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-xs font-mono text-neutral-500 mb-12 hover:text-white transition-colors"
        >
            ← BACK TO JOURNAL
        </Link>
        
        <header className="mb-20 pb-12 border-b border-[#222]">
            <div className="flex gap-4 text-xs font-mono text-neutral-500 mb-6 uppercase tracking-widest">
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                <span>//</span>
                <span>{post.viewCount} Views</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-none">
                {post.title}
            </h1>
            <p className="text-xl text-neutral-400 leading-relaxed max-w-2xl">
                {post.excerpt}
            </p>
        </header>

        <div className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-neutral-400 prose-li:text-neutral-400">
            {/* Simple rendering for now, can be upgraded to Markdown component later */}
            <div className="whitespace-pre-wrap font-sans text-neutral-300">
                {post.content}
            </div>
        </div>
      </div>
    </article>
  );
}
