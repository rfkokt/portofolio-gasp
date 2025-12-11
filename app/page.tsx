import { getPosts, getProjectList } from "@/lib/pocketbase";
import { VelocityHero } from "@/components/aether/VelocityHero";
import { FractureAbout } from "@/components/aether/FractureAbout";
import { LiquidSection } from "@/components/aether/LiquidSection";
import { LensSection } from "@/components/aether/LensSection";
import { ContactSection } from "@/components/aether/ContactSection";

export const revalidate = 60; // ISR

export default async function Home() {
  const [postsResult] = await Promise.all([
    getPosts(),
  ]).catch((e) => {
    console.warn("PocketBase not available at build time, returning empty lists.", e);
    return [{ items: [] }];
  });

  const posts = postsResult?.items || [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <VelocityHero />
      <LensSection />
      <FractureAbout />
      <LiquidSection posts={posts} />
      <ContactSection />
    </main>


  );
}
