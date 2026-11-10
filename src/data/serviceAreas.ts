import { ACTIVE_MARKET_ID, MARKET_SERVICE_AREAS } from '../lib/activeMarket';
import type { CityData } from './cityTypes';

export type { CityData } from './cityTypes';

/** Cities for the currently active local SEO market (sitemap, service area page, etc.). */
export const serviceAreas: CityData[] = MARKET_SERVICE_AREAS[ACTIVE_MARKET_ID];

export const cityBySlug = Object.fromEntries(serviceAreas.map((c) => [c.slug, c]));
