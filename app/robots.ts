import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/app/'],
      },
      // Block aggressive AI/scraper bots that cause runaway function invocations
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'anthropic-ai',
          'ClaudeBot',
          'Google-Extended',
          'FacebookBot',
          'Meta-ExternalAgent',
          'bytespider',
          'Bytedance',
          'SemrushBot',
          'AhrefsBot',
          'MJ12bot',
          'DotBot',
          'PetalBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: 'https://jarve.com.au/sitemap.xml',
  }
}
