// @ts-check
import { defineConfig } from 'astro/config';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { serviceAreas } from './src/data/serviceAreas.ts';

const BASE = 'https://alldentpdr.com';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const corePages = [
  '/',
  '/about',
  '/services',
  '/contact',
  '/service-area',
  '/our-work',
  '/testimonials',
  '/privacy-policy',
  '/hail-damage-repair',
  '/bedford-paintless-dent-repair',
  '/bedford-hail-damage-repair',
  '/bedford-door-ding-repair',
  '/hail-damage-repair-bedford-ohio',
  '/hail-damage-repair-cleveland',
  '/blog',
];

const blogSlugs = readdirSync(path.join(__dirname, 'src/pages/blog'))
  .filter((file) => file.endsWith('.md'))
  .map((file) => file.replace(/\.md$/, ''));

const citySlugs = serviceAreas.map((city) => city.slug);

const cityRoutePrefixes = [
  'hail-damage-repair',
  'paintless-dent-repair',
  'door-ding-repair',
];

// SSR mode requires customPages since non-prerendered pages are not auto-discovered.
const customPages = [
  ...new Set([
    ...corePages.map((page) => `${BASE}${page === '/' ? '' : page}`),
    ...blogSlugs.map((slug) => `${BASE}/blog/${slug}`),
    ...cityRoutePrefixes.flatMap((prefix) =>
      citySlugs.map((slug) => `${BASE}/${prefix}/${slug}`)
    ),
  ]),
];

// https://astro.build/config
export default defineConfig({
  site: BASE,
  trailingSlash: 'never',
  output: 'server',
  adapter: vercel(),
  integrations: [
    react(),
    sitemap({
      customPages,
      filter: (page) =>
        !page.includes('/portal/') &&
        !page.includes('/register') &&
        !page.includes('/card/'),
    }),
  ],
});
