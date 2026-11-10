/**
 * Rotating local SEO market. Change ACTIVE_MARKET_ID when the team deploys to the next storm city.
 */
import { cincinnatiServiceAreas } from '../data/markets/cincinnati';
import { clevelandServiceAreas } from '../data/markets/cleveland';
import type { CityData } from '../data/cityTypes';

export type MarketId = 'cincinnati' | 'cleveland';

/** Update this when your primary local SEO focus moves to a new city. */
export const ACTIVE_MARKET_ID: MarketId = 'cincinnati';

export interface MarketConfig {
  id: MarketId;
  locality: string;
  region: string;
  regionLabel: string;
  serviceAreaSummary: string;
  pdrHubPath: string;
  hailHubPath: string;
  schemaCities: readonly string[];
  /** Short line for nationwide / storm pages */
  deploymentBlurb: string;
  /** Copy for shared city landing page templates */
  localeCopy: {
    heroPillSuffix: string;
    scheduleRegion: string;
    shopAccessNote: string;
    testimonialsHeading: string;
    reviewBylines: [string, string, string];
    hailSeasonNote: string;
    serviceAreaLinkLabel: string;
  };
}

export const MARKETS: Record<MarketId, MarketConfig> = {
  cincinnati: {
    id: 'cincinnati',
    locality: 'Cincinnati',
    region: 'OH',
    regionLabel: 'Greater Cincinnati & Southwest Ohio',
    serviceAreaSummary:
      'Cincinnati, Mason, West Chester, Fairfield, Blue Ash, Milford, and communities throughout Hamilton and Clermont counties',
    pdrHubPath: '/paintless-dent-repair-cincinnati-oh',
    hailHubPath: '/hail-damage-repair-cincinnati',
    schemaCities: [
      'Cincinnati',
      'Norwood',
      'Mason',
      'West Chester',
      'Fairfield',
      'Hamilton',
      'Blue Ash',
      'Milford',
      'Loveland',
      'Kenwood',
    ],
    deploymentBlurb:
      'Our technicians are currently based in Greater Cincinnati for local paintless dent repair. We redeploy to hail-affected markets after major storms.',
    localeCopy: {
      heroPillSuffix: 'Greater Cincinnati PDR',
      scheduleRegion: 'Greater Cincinnati',
      shopAccessNote:
        'Our team serves the Cincinnati metro from hubs along I-71, I-75, and I-275 — Kenwood, Blue Ash, Mason, and east-side suburbs.',
      testimonialsHeading: 'What Greater Cincinnati customers say',
      reviewBylines: [
        '— Hamilton County vehicle owner',
        '— Southwest Ohio driver',
        '— Cincinnati area customer',
      ],
      hailSeasonNote:
        'Southwest Ohio hail season often peaks in spring and summer when cells move up the Ohio River valley and across I-275.',
      serviceAreaLinkLabel: 'View all Cincinnati-area pages →',
    },
  },
  cleveland: {
    id: 'cleveland',
    locality: 'Cleveland',
    region: 'OH',
    regionLabel: 'Greater Cleveland & Northeast Ohio',
    serviceAreaSummary:
      'Bedford, Garfield Heights, Parma, Solon, Independence, and communities throughout Northeast Ohio',
    pdrHubPath: '/paintless-dent-repair-cleveland-oh',
    hailHubPath: '/hail-damage-repair-cleveland',
    schemaCities: [
      'Bedford',
      'Garfield Heights',
      'Parma',
      'Independence',
      'Solon',
      'Cleveland',
    ],
    deploymentBlurb:
      'Northeast Ohio service resumes when our team redeploys after the next regional hail event.',
    localeCopy: {
      heroPillSuffix: 'Northeast Ohio PDR',
      scheduleRegion: 'Northeast Ohio',
      shopAccessNote:
        'When our Northeast Ohio team is on site, the shop is reachable from I-480, I-77, and Rockside Rd — convenient to Bedford, Parma, and inner-ring suburbs.',
      testimonialsHeading: 'What Northeast Ohio customers say',
      reviewBylines: [
        '— Cuyahoga County vehicle owner',
        '— Northeast Ohio driver',
        '— Bedford area customer',
      ],
      hailSeasonNote:
        "Northeast Ohio hail season typically peaks in spring and summer, when fast-moving storm cells cross Lake Erie and the I-480 corridor.",
      serviceAreaLinkLabel: 'View all Northeast Ohio pages →',
    },
  },
};

export function nearbyCitySlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export const MARKET_SERVICE_AREAS: Record<MarketId, CityData[]> = {
  cincinnati: cincinnatiServiceAreas,
  cleveland: clevelandServiceAreas,
};

export function getActiveMarket(): MarketConfig {
  return MARKETS[ACTIVE_MARKET_ID];
}

export function isActiveMarket(marketId: MarketId): boolean {
  return marketId === ACTIVE_MARKET_ID;
}

export function getCityStaticPaths(): Array<{
  params: { city: string };
  props: { city: CityData; marketId: MarketId; isActiveMarket: boolean };
}> {
  const areas = MARKET_SERVICE_AREAS[ACTIVE_MARKET_ID];
  return areas.map((city) => ({
    params: { city: city.slug },
    props: {
      city,
      marketId: ACTIVE_MARKET_ID,
      isActiveMarket: true,
    },
  }));
}
