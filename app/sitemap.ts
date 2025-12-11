import { MetadataRoute } from 'next';
import { getPosts, getProjectList } from '@/lib/pocketbase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://rdev.cloud';

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

  // Fetch dynamic routes
  const [posts, projects] = await Promise.all([
    getPosts().then((res) => res.items).catch(() => []),
    getProjectList().then((res) => res.items).catch(() => [])
  ]);

  const blogRoutes = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated || post.created),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const projectRoutes = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: new Date(project.updated || project.created),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...routes, ...blogRoutes, ...projectRoutes];
}
