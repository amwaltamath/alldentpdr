// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://alldentpdr.com',
  trailingSlash: 'never',
  redirects: {
    '/blog/paintless-dent-repair-cincinnati': '/blog/paintless-dent-repair-cleveland'
  },
  integrations: [react(), sitemap()]
});