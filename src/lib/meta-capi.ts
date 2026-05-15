/**
 * Meta Conversions API (CAPI) helper
 * Sends server-side conversion events to Meta for improved ad attribution.
 *
 * Required Vercel env vars:
 *   META_PIXEL_ID          — your Meta Pixel / Dataset ID
 *   META_CONVERSIONS_TOKEN — your Conversions API access token
 */

import { createHash } from 'crypto';

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export interface CapiUserData {
  email?:     string;
  phone?:     string;
  firstName?: string;
  lastName?:  string;
  city?:      string;
  state?:     string;
  zip?:       string;
  clientIp?:  string;
  userAgent?: string;
  fbc?:       string; // _fbc cookie
  fbp?:       string; // _fbp cookie
}

export interface CapiEvent {
  eventName:    string;          // e.g. "Lead", "CompleteRegistration"
  eventSourceUrl: string;        // page URL where action occurred
  userData:     CapiUserData;
  customData?:  Record<string, unknown>;
  eventId?:     string;          // deduplication ID matching browser pixel
}

export async function sendCapiEvent(event: CapiEvent): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID ?? import.meta.env.META_PIXEL_ID ?? '1284377713827510';
  const token   = process.env.META_CONVERSIONS_TOKEN ?? import.meta.env.META_CONVERSIONS_TOKEN;

  if (!pixelId || !token) {
    console.warn('[meta-capi] META_PIXEL_ID or META_CONVERSIONS_TOKEN not set — skipping');
    return;
  }

  const { userData } = event;

  // Build hashed user_data object — only include fields that are present
  const ud: Record<string, unknown> = {};
  if (userData.email)     ud['em']   = [sha256(userData.email)];
  if (userData.phone)     ud['ph']   = [sha256(userData.phone.replace(/\D/g, ''))];
  if (userData.firstName) ud['fn']   = [sha256(userData.firstName)];
  if (userData.lastName)  ud['ln']   = [sha256(userData.lastName)];
  if (userData.city)      ud['ct']   = [sha256(userData.city)];
  if (userData.state)     ud['st']   = [sha256(userData.state.toLowerCase())];
  if (userData.zip)       ud['zp']   = [sha256(userData.zip)];
  if (userData.clientIp)  ud['client_ip_address'] = userData.clientIp;
  if (userData.userAgent) ud['client_user_agent']  = userData.userAgent;
  if (userData.fbc)       ud['fbc']  = userData.fbc;
  if (userData.fbp)       ud['fbp']  = userData.fbp;

  const payload = {
    data: [
      {
        event_name:        event.eventName,
        event_time:        Math.floor(Date.now() / 1000),
        action_source:     'website',
        event_source_url:  event.eventSourceUrl,
        event_id:          event.eventId ?? `${event.eventName}-${Date.now()}`,
        user_data:         ud,
        ...(event.customData ? { custom_data: event.customData } : {}),
      },
    ],
    // test_event_code: 'TEST12345', // uncomment for Meta test events tool
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      console.error('[meta-capi] API error:', res.status, text);
    }
  } catch (err) {
    // Never let CAPI failure break the main request
    console.error('[meta-capi] fetch error:', err);
  }
}
