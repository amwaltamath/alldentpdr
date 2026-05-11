export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const FROM = 'noreply@alldentpdr.com';
const ADMIN_EMAIL = 'admin@alldentpdr.com';

// Server-side Supabase client (uses anon key with RLS — leads table allows anon INSERT)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { name, email, location, vehicle, message,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer } = body;

  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 422 });
  }

  // Save lead to Supabase (best-effort — don't fail the request if Supabase is unavailable)
  if (supabase) {
    const leadId = `LD-${Date.now().toString().slice(-8)}`;
    await supabase.from('leads').insert({
      id: leadId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (body.phone || '').trim() || null,
      location: (location || '').trim() || null,
      vehicle: (vehicle || '').trim() || null,
      message: message.trim(),
      status: 'New',
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      utm_term: utm_term || null,
      referrer: referrer || null,
    }).then(({ error }) => {
      if (error) console.error('[contact] Supabase lead insert error:', error.message);
    });
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `New Inspection Request from ${name}`,
      html: `
        <h2>New Inspection Request</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px">
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Name</td><td style="padding:8px">${escHtml(name)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Email</td><td style="padding:8px"><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Location</td><td style="padding:8px">${escHtml(location || '—')}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Vehicle</td><td style="padding:8px">${escHtml(vehicle || '—')}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;vertical-align:top">Message</td><td style="padding:8px;white-space:pre-wrap">${escHtml(message)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Source</td><td style="padding:8px;color:#888;font-size:12px">${escHtml([utm_source,utm_medium,utm_campaign].filter(Boolean).join(' / ') || 'organic / direct')}</td></tr>
        </table>
        <p style="margin-top:20px;color:#888;font-size:12px">Sent from alldentpdr.com contact form</p>
      `,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('[contact] Resend error:', err);
    return new Response(JSON.stringify({ error: 'Email delivery failed' }), { status: 500 });
  }
};

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
