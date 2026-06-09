// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const BASE = 'https://alldentpdr.com';

// All indexable pages (SSR mode requires customPages since non-prerendered
// pages are not auto-discovered by the sitemap integration)
const staticPages = [
  `${BASE}/`,
  `${BASE}/about`,
  `${BASE}/services`,
  `${BASE}/contact`,
  `${BASE}/service-area`,
  `${BASE}/bedford-paintless-dent-repair`,
  `${BASE}/bedford-hail-damage-repair`,
  `${BASE}/bedford-door-ding-repair`,
  `${BASE}/hail-damage-repair-bedford-ohio`,
  `${BASE}/hail-damage-repair-cleveland`,
  `${BASE}/blog`,
  `${BASE}/blog/bedford-ohio-hail-damage-repair`,
  `${BASE}/blog/hail-damage-repair-guide`,
  `${BASE}/blog/hail-damage-insurance-claim-guide`,
  `${BASE}/blog/pdr-vs-body-shop`,
  `${BASE}/blog/mobile-pdr-future-of-dent-repair`,
  // Hail damage city pages (prerendered via [city].astro)
  `${BASE}/hail-damage-repair/garfield-heights`,
  `${BASE}/hail-damage-repair/maple-heights`,
  `${BASE}/hail-damage-repair/bedford-heights`,
  `${BASE}/hail-damage-repair/solon`,
  `${BASE}/hail-damage-repair/warrensville-heights`,
  `${BASE}/hail-damage-repair/independence`,
  `${BASE}/hail-damage-repair/seven-hills`,
  `${BASE}/hail-damage-repair/parma`,
  `${BASE}/hail-damage-repair/parma-heights`,
  `${BASE}/hail-damage-repair/brooklyn`,
  `${BASE}/hail-damage-repair/newburgh-heights`,
  `${BASE}/hail-damage-repair/cuyahoga-heights`,
  `${BASE}/hail-damage-repair/valley-view`,
  `${BASE}/hail-damage-repair/brecksville`,
  `${BASE}/hail-damage-repair/north-royalton`,
  `${BASE}/hail-damage-repair/oakwood-village`,
  `${BASE}/hail-damage-repair/northfield`,
  `${BASE}/hail-damage-repair/twinsburg`,
  `${BASE}/hail-damage-repair/walton-hills`,
  `${BASE}/hail-damage-repair/beachwood`,
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
      customPages: staticPages,
      filter: (page) =>
        !page.includes('/portal/') &&
        !page.includes('/register') &&
        !page.includes('/card/'),
    }),
  ],
});