import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const host = process.env['NEXTAUTH_URL'] || 'http://localhost:3000';
  const now = new Date().toISOString();
  const paths = ['/', '/dashboard', '/content', '/pricing', '/privacy', '/terms'];
  return paths.map((p) => ({ url: `${host}${p}`, lastModified: now, changeFrequency: 'weekly', priority: p === '/' ? 1 : 0.7 }));
}
