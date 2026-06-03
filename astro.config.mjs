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
  `${BASE}/bedford-door-ding-repair`,
  `${BASE}/hail-damage-repair-bedford-ohio`,
  `${BASE}/hail-damage-repair-cleveland`,
  `${BASE}/blog`,
  `${BASE}/blog/bedford-ohio-hail-damage-repair`,
  `${BASE}/blog/hail-damage-repair-bedford-ohio-2026`,
  `${BASE}/blog/hail-damage-repair-guide`,
  `${BASE}/blog/hail-damage-insurance-claim-guide`,
  `${BASE}/blog/pdr-vs-body-shop`,
  `${BASE}/blog/mobile-pdr-future-of-dent-repair`,
  // Hail damage city pages (prerendered via [city].astro)
  `${BASE}/hail-damage-repair/garfield-heights`,
  `${BASE}/hail-damage-repair/maple-heights`,
  `${BASE}/hail-damage-repair/bedford`,
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
  // Door ding repair city pages
  `${BASE}/door-ding-repair/garfield-heights`,
  `${BASE}/door-ding-repair/maple-heights`,
  `${BASE}/door-ding-repair/bedford`,
  `${BASE}/door-ding-repair/bedford-heights`,
  `${BASE}/door-ding-repair/solon`,
  `${BASE}/door-ding-repair/warrensville-heights`,
  `${BASE}/door-ding-repair/independence`,
  `${BASE}/door-ding-repair/seven-hills`,
  `${BASE}/door-ding-repair/parma`,
  `${BASE}/door-ding-repair/parma-heights`,
  `${BASE}/door-ding-repair/brooklyn`,
  `${BASE}/door-ding-repair/newburgh-heights`,
  `${BASE}/door-ding-repair/cuyahoga-heights`,
  `${BASE}/door-ding-repair/valley-view`,
  `${BASE}/door-ding-repair/brecksville`,
  `${BASE}/door-ding-repair/north-royalton`,
  `${BASE}/door-ding-repair/oakwood-village`,
  `${BASE}/door-ding-repair/northfield`,
  `${BASE}/door-ding-repair/twinsburg`,
  `${BASE}/door-ding-repair/walton-hills`,
  `${BASE}/door-ding-repair/beachwood`,
  // Paintless dent repair city pages
  `${BASE}/paintless-dent-repair/garfield-heights`,
  `${BASE}/paintless-dent-repair/maple-heights`,
  `${BASE}/paintless-dent-repair/bedford`,
  `${BASE}/paintless-dent-repair/bedford-heights`,
  `${BASE}/paintless-dent-repair/solon`,
  `${BASE}/paintless-dent-repair/warrensville-heights`,
  `${BASE}/paintless-dent-repair/independence`,
  `${BASE}/paintless-dent-repair/seven-hills`,
  `${BASE}/paintless-dent-repair/parma`,
  `${BASE}/paintless-dent-repair/parma-heights`,
  `${BASE}/paintless-dent-repair/brooklyn`,
  `${BASE}/paintless-dent-repair/newburgh-heights`,
  `${BASE}/paintless-dent-repair/cuyahoga-heights`,
  `${BASE}/paintless-dent-repair/valley-view`,
  `${BASE}/paintless-dent-repair/brecksville`,
  `${BASE}/paintless-dent-repair/north-royalton`,
  `${BASE}/paintless-dent-repair/oakwood-village`,
  `${BASE}/paintless-dent-repair/northfield`,
  `${BASE}/paintless-dent-repair/twinsburg`,
  `${BASE}/paintless-dent-repair/walton-hills`,
  `${BASE}/paintless-dent-repair/beachwood`,
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