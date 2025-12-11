import { prisma } from "@/lib/prisma";
import { BlogList } from "@/components/blog/BlogList";

export const revalidate = 60; // ISR

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  }).catch((e) => {
    console.warn("Database not available at build time, returning empty post list.");
    return [];
  });

  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="section-label mb-8">[ 03. JOURNAL ]</div>
        <h1 className="text-6xl md:text-8xl font-black text-foreground tracking-tighter">
          THOUGHTS<br />& INSIGHTS
        </h1>
      </div>
      
      <BlogList posts={posts} />
    </div>
  );
}
