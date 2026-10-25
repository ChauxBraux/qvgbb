import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import youth from './src/data/youth.json' with { type: 'json' };

export default defineConfig({
  site: 'https://qvgirlsbasketball.org',
  integrations: [
    tailwind(),
    mdx(),
    // Keep the youth page out of the sitemap until it's ready to share.
    sitemap({ filter: page => youth.ready || !page.includes('/youth') }),
  ],
});
