// @ts-check
import { defineConfig } from 'astro/config';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { getActiveMarket } from './src/lib/activeMarket.ts';
import { isExcludedFromSitemap } from './src/lib/sitemapPolicy.ts';
import { serviceAreas } from './src/data/serviceAreas.ts';

const BASE = 'https://alldentpdr.com';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const active = getActiveMarket();

const corePages = [
  '/',
  '/about',
  '/services',
  '/services/paintless-dent-repair',
  '/services/door-ding-repair',
  '/services/minor-collision-dent-repair',
  '/services/insurance-hail-damage-repair',
  '/services/autobody-collision-repair',
  '/autobody-repair',
  '/nationwide-hail-damage-repair',
  '/contact',
  '/service-area',
  '/our-work',
  '/testimonials',
  '/privacy-policy',
  '/hail-damage-repair',
  active.pdrHubPath,
  active.hailHubPath,
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
  'autobody-repair',
];

// SSR mode requires customPages since non-prerendered pages are not auto-discovered.
const customPages = [
  ...new Set([
    ...corePages.map((page) => `${BASE}${page === '/' ? '' : page}`),
    ...blogSlugs.map((slug) => `${BASE}/blog/${slug}`),
    ...cityRoutePrefixes.flatMap((prefix) =>
      citySlugs.map((slug) => `${BASE}/${prefix}/${slug}`),
    ),
  ]),
].filter((url) => !isExcludedFromSitemap(url));

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
      filter: (page) => !isExcludedFromSitemap(page),
    }),
  ],
});
