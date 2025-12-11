import { getPosts, getProjectList } from "@/lib/pocketbase";
import { VelocityHero } from "@/components/aether/VelocityHero";
import { FractureAbout } from "@/components/aether/FractureAbout";
import { LiquidSection } from "@/components/aether/LiquidSection";
import { LensSection } from "@/components/aether/LensSection";
import { ContactSection } from "@/components/aether/ContactSection";

export const revalidate = 60; // ISR

export default async function Home() {
  const postsResult = await getPosts().catch((e) => {
      console.error("Error fetching posts:", e);
      return { items: [] };
  });

  const projectsResult = await getProjectList().catch((e) => {
      console.error("Error fetching projects:", e);
      return { items: [] };
  });

  const posts = postsResult?.items || [];
  const projects = projectsResult?.items || [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <VelocityHero />
      <LensSection />
      <FractureAbout projects={projects} />
      <LiquidSection posts={posts} />
      <ContactSection />
    </main>


  );
}
