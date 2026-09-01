export interface GoogleReview {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
  profileUrl?: string;
}

export interface GoogleReviewsData {
  placeName: string;
  rating: number | null;
  reviewCount: number | null;
  reviews: GoogleReview[];
  googleMapsUri: string;
  leaveReviewUri: string;
  source: 'live' | 'fallback';
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_PLACE_ID = 'ChIJ6zI1PqTzMIgRz1d70_Y2o9w';
const DEFAULT_GOOGLE_URI = 'https://share.google/7cCa7EhinPDCM8Owu';

let cache: { data: GoogleReviewsData; expiresAt: number } | null = null;

function fallbackReviews(): GoogleReviewsData {
  return {
    placeName: 'All Dent PDR',
    rating: 5,
    reviewCount: 47,
    reviews: [],
    googleMapsUri: DEFAULT_GOOGLE_URI,
    leaveReviewUri: DEFAULT_GOOGLE_URI,
    source: 'fallback',
  };
}

function mapPlacesResponse(payload: Record<string, unknown>): GoogleReviewsData {
  const reviewsRaw = Array.isArray(payload.reviews) ? payload.reviews : [];
  const displayName = payload.displayName as { text?: string } | undefined;
  const googleMapsUri = String(payload.googleMapsUri || DEFAULT_GOOGLE_URI);

  const reviews: GoogleReview[] = reviewsRaw.slice(0, 5).map((item) => {
    const review = item as Record<string, unknown>;
    const textObj = review.text as { text?: string } | undefined;
    const author = review.authorAttribution as { displayName?: string; uri?: string } | undefined;
    return {
      author: String(author?.displayName || 'Google reviewer'),
      rating: Number(review.rating || 5),
      text: String(textObj?.text || '').trim(),
      relativeTime: String(review.relativePublishTimeDescription || ''),
      profileUrl: author?.uri ? String(author.uri) : undefined,
    };
  }).filter((review) => review.text);

  return {
    placeName: String(displayName?.text || 'All Dent PDR'),
    rating: payload.rating != null ? Number(payload.rating) : null,
    reviewCount: payload.userRatingCount != null ? Number(payload.userRatingCount) : null,
    reviews,
    googleMapsUri,
    leaveReviewUri: googleMapsUri,
    source: 'live',
  };
}

export async function getGoogleReviews(): Promise<GoogleReviewsData> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  const apiKey = import.meta.env.GOOGLE_PLACES_API_KEY;
  const placeId = import.meta.env.GOOGLE_PLACE_ID || DEFAULT_PLACE_ID;

  if (!apiKey) {
    return fallbackReviews();
  }

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews,googleMapsUri',
      },
    });

    if (!response.ok) {
      throw new Error(`Places API ${response.status}`);
    }

    const payload = await response.json() as Record<string, unknown>;
    const data = mapPlacesResponse(payload);
    cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  } catch (error) {
    console.warn('[google-reviews] Falling back to static profile link:', error);
    return fallbackReviews();
  }
}

export function formatStarRating(rating: number | null): string {
  if (!rating) return '★★★★★';
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}
