/** Canonical business identity for copy, schema, and contact consistency. */

export const BUSINESS = {
  name: 'All Dent PDR',
  brand: 'AllDent PDR',
  url: 'https://alldentpdr.com',
  phone: '1-855-425-5336',
  phoneTel: '18554255336',
  email: 'admin@alldentpdr.com',
  addressLocality: 'Cleveland',
  addressRegion: 'OH',
  addressCountry: 'US',
  /** Public-facing service region (no street address on the website). */
  regionLabel: 'Greater Cleveland & Northeast Ohio',
  serviceAreaSummary:
    'Bedford, Garfield Heights, Parma, Solon, Independence, and communities throughout Northeast Ohio',
  googleReviewUrl: 'https://share.google/7cCa7EhinPDCM8Owu',
  facebookUrl: 'https://www.facebook.com/alldentpdr/',
} as const;

/** Primary public lead action (forms only — no click-to-call on marketing pages). */
export const LEAD_CTA = {
  href: '/contact',
  label: 'Get free estimate',
  shortLabel: 'Free estimate',
} as const;

export const SAME_AS = [BUSINESS.googleReviewUrl, BUSINESS.facebookUrl];

export const SERVICE_AREA_CITIES = [
  'Bedford',
  'Bedford Heights',
  'Garfield Heights',
  'Maple Heights',
  'Parma',
  'Independence',
  'Solon',
  'Warrensville Heights',
  'Twinsburg',
  'Beachwood',
  'Cleveland',
] as const;

export const SHOP_TAGLINE =
  'Professional paintless dent repair and hail damage restoration serving Greater Cleveland and Northeast Ohio.';

export const OPENING_HOURS_SPECIFICATION = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '18:00',
  },
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Saturday'],
    opens: '09:00',
    closes: '14:00',
  },
] as const;

export function postalAddressSchema() {
  return {
    '@type': 'PostalAddress',
    addressLocality: BUSINESS.addressLocality,
    addressRegion: BUSINESS.addressRegion,
    addressCountry: BUSINESS.addressCountry,
  };
}

export function aggregateRatingSchema() {
  return {
    '@type': 'AggregateRating',
    ratingValue: '5',
    reviewCount: '47',
    bestRating: '5',
    worstRating: '1',
  };
}

export interface LocalBusinessSchemaOptions {
  name?: string;
  description?: string;
  url?: string;
  areaServed?: Array<string | Record<string, unknown>>;
}

/** Shared LocalBusiness + AutoRepair JSON-LD for site-wide and landing pages. */
export function buildLocalBusinessSchema(options: LocalBusinessSchemaOptions = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': ['AutoRepair', 'LocalBusiness'],
    name: options.name ?? BUSINESS.name,
    description: options.description ?? SHOP_TAGLINE,
    url: options.url ?? BUSINESS.url,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    image: `${BUSINESS.url}/images/logo-branded.svg`,
    logo: `${BUSINESS.url}/images/logo-branded.svg`,
    address: postalAddressSchema(),
    areaServed: (options.areaServed ?? SERVICE_AREA_CITIES.map((c) => `${c}, OH`)).map((item) =>
      typeof item === 'string' ? { '@type': 'City', name: item } : item,
    ),
    openingHoursSpecification: OPENING_HOURS_SPECIFICATION,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Paintless Dent Repair Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Paintless Dent Repair',
            description: 'Paintless dent repair preserving factory paint',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Hail Damage Repair',
            description: 'Panel-by-panel hail dent restoration with insurance support',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Door Ding Repair',
            description: 'Paintless removal of parking lot dings and minor creases',
          },
        },
      ],
    },
    sameAs: SAME_AS,
    aggregateRating: aggregateRatingSchema(),
  };
}
