/**
 * Meta Lead Ads — fetch lead details from Graph API and map to our leads table shape.
 *
 * Required env vars:
 *   META_PAGE_ACCESS_TOKEN — Page access token with leads_retrieval permission
 */

export interface MetaLeadField {
  name: string;
  values: string[];
}

export interface MetaLeadPayload {
  id: string;
  created_time?: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  field_data?: MetaLeadField[];
}

export interface MappedMetaLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  vehicle: string | null;
  message: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string;
  event_id: string;
}

const STANDARD_FIELDS = new Set([
  'full_name',
  'first_name',
  'last_name',
  'email',
  'email_address',
  'phone_number',
  'phone',
  'city',
  'state',
  'zip_code',
  'street_address',
  'vehicle',
  'vehicle_year_make_model',
]);

function fieldMap(fieldData: MetaLeadField[] = []): Record<string, string> {
  const map: Record<string, string> = {};
  for (const field of fieldData) {
    const key = field.name.toLowerCase().replace(/\s+/g, '_');
    const value = (field.values?.[0] || '').trim();
    if (value) map[key] = value;
  }
  return map;
}

export function mapMetaLeadToRow(payload: MetaLeadPayload): MappedMetaLead | null {
  const fields = fieldMap(payload.field_data);
  const email = (fields.email || fields.email_address || '').toLowerCase();
  if (!email) return null;

  const name =
    fields.full_name ||
    [fields.first_name, fields.last_name].filter(Boolean).join(' ') ||
    'Meta Lead';

  const phone = fields.phone_number || fields.phone || null;

  const locationParts = [
    fields.street_address,
    fields.city,
    fields.state,
    fields.zip_code,
  ].filter(Boolean);
  const location = locationParts.length ? locationParts.join(', ') : null;

  const vehicle = fields.vehicle || fields.vehicle_year_make_model || null;

  const extraLines: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (STANDARD_FIELDS.has(key)) continue;
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    extraLines.push(`${label}: ${value}`);
  }

  const messageParts = [
    'Submitted via Meta Lead Ad form.',
    payload.ad_name ? `Ad: ${payload.ad_name}` : null,
    payload.adset_name ? `Ad set: ${payload.adset_name}` : null,
    payload.campaign_name ? `Campaign: ${payload.campaign_name}` : null,
    payload.form_id ? `Form ID: ${payload.form_id}` : null,
    extraLines.length ? '\nAdditional answers:\n' + extraLines.join('\n') : null,
  ].filter(Boolean);

  return {
    id: `LD-meta-${payload.id}`,
    name,
    email,
    phone,
    location,
    vehicle,
    message: messageParts.join('\n'),
    utm_source: 'facebook',
    utm_medium: 'lead_form',
    utm_campaign: payload.campaign_name || payload.ad_name || null,
    utm_content: payload.adset_name || payload.form_id || null,
    utm_term: payload.ad_id || null,
    referrer: `meta-lead-ad:${payload.form_id || 'unknown'}`,
    event_id: `meta-lead-${payload.id}`,
  };
}

export async function fetchMetaLead(leadgenId: string): Promise<MetaLeadPayload | null> {
  const token =
    process.env.META_PAGE_ACCESS_TOKEN ??
    import.meta.env.META_PAGE_ACCESS_TOKEN;

  if (!token) {
    console.error('[meta-leadgen] META_PAGE_ACCESS_TOKEN not set');
    return null;
  }

  const fields = [
    'created_time',
    'id',
    'ad_id',
    'ad_name',
    'adset_id',
    'adset_name',
    'campaign_id',
    'campaign_name',
    'form_id',
    'field_data',
  ].join(',');

  const url = `https://graph.facebook.com/v19.0/${leadgenId}?fields=${fields}&access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error('[meta-leadgen] Graph API error:', res.status, text);
      return null;
    }
    return (await res.json()) as MetaLeadPayload;
  } catch (err) {
    console.error('[meta-leadgen] fetch error:', err);
    return null;
  }
}
