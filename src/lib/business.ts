/** Canonical business identity for copy, schema, and NAP consistency. */

export const BUSINESS = {
  name: 'All Dent PDR',
  brand: 'AllDent PDR',
  url: 'https://alldentpdr.com',
  phone: '1-855-425-5336',
  phoneTel: '18554255336',
  email: 'admin@alldentpdr.com',
  streetAddress: '7695 Granger Rd',
  addressLocality: 'Cleveland',
  addressRegion: 'OH',
  postalCode: '44125',
  addressCountry: 'US',
  fullAddress: '7695 Granger Rd, Cleveland, OH 44125',
  latitude: 41.396,
  longitude: -81.61,
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=7695+Granger+Rd,+Cleveland,+OH+44125',
  googleReviewUrl: 'https://share.google/7cCa7EhinPDCM8Owu',
  facebookUrl: 'https://www.facebook.com/alldentpdr/',
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
  'Professional paintless dent repair shop at 7695 Granger Rd, Cleveland, OH 44125 — serving Bedford, Garfield Heights, Parma, and Northeast Ohio.';

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
    streetAddress: BUSINESS.streetAddress,
    addressLocality: BUSINESS.addressLocality,
    addressRegion: BUSINESS.addressRegion,
    postalCode: BUSINESS.postalCode,
    addressCountry: BUSINESS.addressCountry,
  };
}

export function geoSchema() {
  return {
    '@type': 'GeoCoordinates',
    latitude: BUSINESS.latitude,
    longitude: BUSINESS.longitude,
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
    geo: geoSchema(),
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
            description: 'In-shop paintless dent repair preserving factory paint',
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
