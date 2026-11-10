/**
 * URLs excluded from sitemap — must stay in sync with BaseLayout noindex pages.
 */
import { ACTIVE_MARKET_ID, MARKET_SERVICE_AREAS } from './activeMarket';

const CITY_ROUTE_PREFIXES = [
  'paintless-dent-repair',
  'hail-damage-repair',
  'door-ding-repair',
  'autobody-repair',
] as const;

/** Standalone marketing pages marked noindex (inactive / legacy markets). */
/** Legacy local-market blog URLs (301 elsewhere) — omit from sitemap. */
export const INACTIVE_MARKET_BLOG_SLUGS = new Set([
  'bedford-ohio-hail-damage-repair',
  'hail-damage-repair-bedford-ohio-2026',
  'autobody-repair-cleveland-ohio',
  'no-wait-hail-damage-repair',
]);

export const STATIC_NOINDEX_PATHS = new Set([
  '/bedford-paintless-dent-repair',
  '/bedford-hail-damage-repair',
  '/bedford-door-ding-repair',
  '/hail-damage-repair-bedford-ohio',
  '/hail-damage-repair-cleveland',
  '/paintless-dent-repair-cleveland-oh',
  '/autobody-repair-cleveland',
]);

function inactiveMarketCitySlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const [marketId, areas] of Object.entries(MARKET_SERVICE_AREAS) as [
    keyof typeof MARKET_SERVICE_AREAS,
    (typeof MARKET_SERVICE_AREAS)[keyof typeof MARKET_SERVICE_AREAS],
  ][]) {
    if (marketId === ACTIVE_MARKET_ID) continue;
    for (const city of areas) slugs.add(city.slug);
  }
  return slugs;
}

const inactiveCitySlugs = inactiveMarketCitySlugs();

function normalizePath(pageUrl: string): string {
  try {
    const path = new URL(pageUrl).pathname.replace(/\/$/, '');
    return path || '/';
  } catch {
    return pageUrl.replace(/\/$/, '') || '/';
  }
}

export function isExcludedFromSitemap(pageUrl: string): boolean {
  const path = normalizePath(pageUrl);

  if (STATIC_NOINDEX_PATHS.has(path)) return true;

  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch && ACTIVE_MARKET_ID !== 'cleveland' && INACTIVE_MARKET_BLOG_SLUGS.has(blogMatch[1])) {
    return true;
  }

  if (
    path.includes('/portal/') ||
    path === '/register' ||
    path.startsWith('/card/')
  ) {
    return true;
  }

  for (const prefix of CITY_ROUTE_PREFIXES) {
    const match = path.match(new RegExp(`^/${prefix}/([^/]+)$`));
    if (match && inactiveCitySlugs.has(match[1])) return true;
  }

  return false;
}
