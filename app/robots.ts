import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://rdev.cloud';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/api/'], // Disallow internal paths
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
