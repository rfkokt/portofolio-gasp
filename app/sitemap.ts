import { MetadataRoute } from 'next';
import { getPosts, getProjectList } from '@/lib/pocketbase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://rdev.cloud';

  try {
    // Static routes
    const routes = [
      '',
      '/about',
      '/blog',
      '/projects',
    ].map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: route === '' ? 1 : 0.8,
    }));

    // Fetch dynamic routes with safe fallback
    const [posts, projects] = await Promise.all([
      getPosts().then((res) => res?.items || []).catch((err) => {
        console.error('Sitemap: Failed to fetch posts', err);
        return [];
      }),
      getProjectList().then((res) => res?.items || []).catch((err) => {
         console.error('Sitemap: Failed to fetch projects', err);
         return [];
      })
    ]);

    const blogRoutes = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated || post.created || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const projectRoutes = projects.map((project) => ({
      url: `${baseUrl}/projects/${project.slug}`,
      lastModified: new Date(project.updated || project.created || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [...routes, ...blogRoutes, ...projectRoutes];

  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Fallback to static routes
    return [
      '',
      '/about',
      '/blog',
      '/projects',
    ].map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  }
}
