import { prisma } from "@/lib/prisma";
import { VelocityHero } from "@/components/aether/VelocityHero";
import { FractureAbout } from "@/components/aether/FractureAbout";
import { LiquidSection } from "@/components/aether/LiquidSection";
import { LensSection } from "@/components/aether/LensSection";
import { ContactSection } from "@/components/aether/ContactSection";

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
      <LensSection />
      <FractureAbout />
      <LiquidSection posts={posts} />
      <ContactSection />
    </main>


  );
}
