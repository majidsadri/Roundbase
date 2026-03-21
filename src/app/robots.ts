import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/app/', '/auth/'],
      },
    ],
    sitemap: 'https://www.roundbase.net/sitemap.xml',
  };
}
