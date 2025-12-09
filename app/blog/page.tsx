import { prisma } from "@/lib/prisma";
import { BlogList } from "@/components/blog/BlogList";

export const revalidate = 60; // ISR

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="section-label mb-8">[ 03. JOURNAL ]</div>
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mix-blend-difference">
          THOUGHTS<br />& INSIGHTS
        </h1>
      </div>
      
      <BlogList posts={posts} />
    </div>
  );
}
