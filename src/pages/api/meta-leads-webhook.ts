export const prerender = false;

import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { fetchMetaLead, mapMetaLeadToRow } from '../../lib/meta-leadgen';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const FROM = 'noreply@alldentpdr.com';
const ADMIN_EMAIL = 'admin@alldentpdr.com';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function env(name: string): string | undefined {
  return process.env[name] ?? import.meta.env[name];
}

function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = env('META_APP_SECRET');
  if (!appSecret || !signatureHeader?.startsWith('sha256=')) return false;

  const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const received = signatureHeader.slice(7);

  try {
    return timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Meta webhook subscription verification (GET). */
export const GET: APIRoute = async ({ url }) => {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const verifyToken = env('META_WEBHOOK_VERIFY_TOKEN');

  if (mode === 'subscribe' && token && verifyToken && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
};

/** Meta Lead Ads webhook (POST) — ingests leadgen events into Supabase leads. */
export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!verifyMetaSignature(rawBody, signature)) {
    console.warn('[meta-leads-webhook] Invalid signature');
    return new Response('Forbidden', { status: 403 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  if (payload.object !== 'page' || !Array.isArray(payload.entry)) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
  }

  const leadgenIds: string[] = [];
  for (const entry of payload.entry as Array<{ changes?: Array<{ field?: string; value?: { leadgen_id?: string } }> }>) {
    for (const change of entry.changes || []) {
      if (change.field === 'leadgen' && change.value?.leadgen_id) {
        leadgenIds.push(change.value.leadgen_id);
      }
    }
  }

  if (!leadgenIds.length) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), { status: 200 });
  }

  let processed = 0;

  for (const leadgenId of leadgenIds) {
    const metaLead = await fetchMetaLead(leadgenId);
    if (!metaLead) continue;

    const row = mapMetaLeadToRow(metaLead);
    if (!row || !supabase) continue;

    const { error } = await supabase.from('leads').insert({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      location: row.location,
      vehicle: row.vehicle,
      message: row.message,
      status: 'New',
      utm_source: row.utm_source,
      utm_medium: row.utm_medium,
      utm_campaign: row.utm_campaign,
      utm_content: row.utm_content,
      utm_term: row.utm_term,
      referrer: row.referrer,
      event_id: row.event_id,
    });

    if (error) {
      // Duplicate webhook delivery — Meta may retry the same leadgen_id.
      if (error.code === '23505') {
        console.info('[meta-leads-webhook] Duplicate lead skipped:', leadgenId);
        continue;
      }
      console.error('[meta-leads-webhook] Supabase insert error:', error.message);
      continue;
    }

    processed += 1;

    try {
      await resend.emails.send({
        from: FROM,
        to: ADMIN_EMAIL,
        replyTo: row.email,
        subject: `New Meta Lead Ad — ${row.name}`,
        html: `
          <h2>New Meta Lead Ad Submission</h2>
          <p style="color:#666;font-size:13px">Imported automatically from your Facebook/Instagram lead campaign.</p>
          <table style="border-collapse:collapse;width:100%;max-width:600px">
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Name</td><td style="padding:8px">${escHtml(row.name)}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Email</td><td style="padding:8px"><a href="mailto:${escHtml(row.email)}">${escHtml(row.email)}</a></td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Phone</td><td style="padding:8px">${escHtml(row.phone || '—')}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Location</td><td style="padding:8px">${escHtml(row.location || '—')}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Vehicle</td><td style="padding:8px">${escHtml(row.vehicle || '—')}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;vertical-align:top">Details</td><td style="padding:8px;white-space:pre-wrap">${escHtml(row.message)}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Campaign</td><td style="padding:8px">${escHtml(row.utm_campaign || '—')}</td></tr>
          </table>
          <p style="margin-top:20px;color:#888;font-size:12px">View in admin portal → Leads tab · Lead ID ${escHtml(row.id)}</p>
        `,
      });
    } catch (err) {
      console.error('[meta-leads-webhook] Resend error:', err);
    }
  }

  return new Response(JSON.stringify({ ok: true, processed }), { status: 200 });
};
