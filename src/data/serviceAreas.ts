export interface ServiceArea {
  name: string;
  slug: string;
  isHomeBase?: boolean;
  intro?: string;
}

export const serviceAreas: ServiceArea[] = [
  {
    name: 'Bedford',
    slug: 'bedford-oh',
    isHomeBase: true,
    intro: 'AllDent PDR is headquartered in Bedford, OH. As your local paintless dent repair team, we know the Greater Cleveland area inside and out — and we come to your driveway, workplace, or dealership for every repair.'
  },
  {
    name: 'Bedford Heights',
    slug: 'bedford-heights-oh',
    intro: 'Bedford Heights drivers deal with tight parking lots, shopping center dings, and Northeast Ohio weather year-round. Our mobile PDR team is just minutes away and handles door dings, hail damage, and minor collision dents on-site.'
  },
  {
    name: 'Cleveland',
    slug: 'cleveland-oh',
    intro: 'From downtown parking garages to neighborhood street parking, Cleveland vehicles take their share of dents. AllDent PDR brings professional paintless dent repair directly to you anywhere in the city — no body shop visit required.'
  },
  {
    name: 'Cleveland Heights',
    slug: 'cleveland-heights-oh',
    intro: 'Cleveland Heights has dense residential streets and busy commercial corridors where door dings happen daily. We provide mobile paintless dent repair throughout the city with same-day photo estimates and fast on-site service.'
  },
  {
    name: 'Shaker Heights',
    slug: 'shaker-heights-oh',
    intro: 'Shaker Heights drivers expect quality — and so do we. Our paintless dent repair preserves your factory finish without fillers or repainting, keeping your vehicle looking its best on Van Aken, Lee Road, and beyond.'
  },
  {
    name: 'Warrensville Heights',
    slug: 'warrensville-heights-oh',
    intro: 'Whether you picked up a dent at a retail lot or after a Northeast Ohio storm, AllDent PDR serves Warrensville Heights with mobile paintless dent repair that comes to your location.'
  },
  {
    name: 'Maple Heights',
    slug: 'maple-heights-oh',
    intro: 'Maple Heights residents and commuters rely on AllDent PDR for fast, affordable dent removal. We handle door dings, hail damage, and minor collision dents while preserving your original factory paint.'
  },
  {
    name: 'Garfield Heights',
    slug: 'garfield-heights-oh',
    intro: 'Garfield Heights is right in our backyard. Our mobile PDR technicians serve the area daily — repairing dents at your home, office, or anywhere convenient for you.'
  },
  {
    name: 'Beachwood',
    slug: 'beachwood-oh',
    intro: 'Beachwood\'s busy retail and office corridors mean plenty of parking lot dings. AllDent PDR provides discreet, professional mobile paintless dent repair so you never have to leave work or home for a repair.'
  },
  {
    name: 'Parma',
    slug: 'parma-oh',
    intro: 'Parma is one of the largest suburbs in Cuyahoga County — and one of our most active service areas. From Ridge Road to State Road, we bring paintless dent repair to Parma drivers at their location.'
  },
  {
    name: 'Lakewood',
    slug: 'lakewood-oh',
    intro: 'Lakewood\'s tight street parking and busy Detroit Avenue corridor make door dings a common headache. Our mobile PDR service comes to you anywhere in Lakewood for fast, factory-quality dent repair.'
  },
  {
    name: 'Solon',
    slug: 'solon-oh',
    intro: 'Solon drivers and businesses trust AllDent PDR for professional paintless dent repair. We handle everything from single door dings to multi-panel hail damage — all at your location.'
  },
  {
    name: 'Strongsville',
    slug: 'strongsville-oh',
    intro: 'Strongsville\'s growing retail and residential areas see their share of parking lot damage. AllDent PDR provides mobile paintless dent repair throughout Strongsville with transparent, photo-based pricing.'
  },
  {
    name: 'North Olmsted',
    slug: 'north-olmsted-oh',
    intro: 'North Olmsted drivers don\'t need to drive to a body shop for dent repair. AllDent PDR comes to you with mobile paintless dent repair — preserving your factory finish at a fraction of conventional repair cost.'
  },
  {
    name: 'Akron',
    slug: 'akron-oh',
    intro: 'Akron is within our regular Greater Cleveland service range. Whether you have hail damage from a Northeast Ohio storm or a parking lot ding downtown, our mobile PDR team travels to Akron for on-site repairs.'
  },
  {
    name: 'Mentor',
    slug: 'mentor-oh',
    intro: 'Mentor and Lake County drivers count on AllDent PDR for hail damage recovery and everyday dent repair. We bring our full mobile setup to your location for professional, paint-preserving results.'
  },
  {
    name: 'Elyria',
    slug: 'elyria-oh',
    intro: 'Elyria drivers in Lorain County can access the same mobile paintless dent repair service trusted across Greater Cleveland. Send us photos for a free same-day estimate.'
  },
  {
    name: 'Brunswick',
    slug: 'brunswick-oh',
    intro: 'Brunswick is part of our extended Greater Cleveland service area. AllDent PDR handles door dings, hail dents, and minor collision damage with mobile on-site repair — no shop visit needed.'
  }
];

export function getServiceArea(slug: string): ServiceArea | undefined {
  return serviceAreas.find((area) => area.slug === slug);
}

export function getNearbyAreas(current: ServiceArea, count = 5): ServiceArea[] {
  const index = serviceAreas.findIndex((area) => area.slug === current.slug);
  if (index === -1) return serviceAreas.slice(0, count);

  const nearby: ServiceArea[] = [];
  for (let offset = 1; nearby.length < count && offset < serviceAreas.length; offset++) {
    const next = serviceAreas[(index + offset) % serviceAreas.length];
    if (next.slug !== current.slug) nearby.push(next);
  }
  return nearby;
}
