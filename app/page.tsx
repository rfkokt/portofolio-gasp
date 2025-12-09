import { prisma } from "@/lib/prisma";
import { VelocityHero } from "@/components/aether/VelocityHero";
import { FractureAbout } from "@/components/aether/FractureAbout";
import { SpotlightGrid } from "@/components/aether/SpotlightGrid";
import { LiquidSection } from "@/components/aether/LiquidSection";
import { LensSection } from "@/components/aether/LensSection";

export const revalidate = 60; // ISR

export default async function Home() {
  const [projects, posts] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      where: { published: true },
      take: 3,
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <VelocityHero />
      <FractureAbout />
      <SpotlightGrid projects={projects} />
      <LiquidSection posts={posts} />
      <LensSection />
    </main>

  );
}
