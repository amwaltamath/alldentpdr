export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const FROM = 'noreply@alldentpdr.com';
const ADMIN_EMAIL = 'admin@alldentpdr.com';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function esc(s: string) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  } as Record<string, string>)[c]);
}

export const POST: APIRoute = async ({ request }) => {
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Chat unavailable' }), { status: 503 });
  }

  let body: Record<string, string>;
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 }); }

  const token = (body.token || '').trim();
  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const phone = (body.phone || '').trim();
  const pageUrl = (body.page_url || '').trim();
  const message = (body.message || '').trim();

  if (token.length < 16) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400 });
  }
  if (!message) {
    return new Response(JSON.stringify({ error: 'Message required' }), { status: 422 });
  }

  const { data, error } = await supabase.rpc('chat_start_conversation', {
    p_token: token,
    p_name: name || null,
    p_email: email || null,
    p_phone: phone || null,
    p_page_url: pageUrl || null,
    p_first_message: message,
  });

  if (error) {
    console.error('[chat/start] rpc error:', error.message);
    return new Response(JSON.stringify({ error: 'Could not start chat' }), { status: 500 });
  }

  // Email admin (best-effort)
  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: email || undefined,
      subject: `💬 New live chat from ${name || 'website visitor'}`,
      html: `
        <h2>New live chat conversation</h2>
        <p>A visitor just started a chat on the website.</p>
        <table style="border-collapse:collapse;width:100%;max-width:560px">
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Name</td><td style="padding:8px">${esc(name || '—')}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Email</td><td style="padding:8px">${esc(email || '—')}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Phone</td><td style="padding:8px">${esc(phone || '—')}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Page</td><td style="padding:8px">${esc(pageUrl || '—')}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;vertical-align:top">Message</td><td style="padding:8px;white-space:pre-wrap">${esc(message)}</td></tr>
        </table>
        <p style="margin-top:18px">
          <a href="https://alldentpdr.com/portal/admin-dashboard?view=messages"
             style="background:#b0522b;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">
            Open admin chat →
          </a>
        </p>
        <p style="color:#888;font-size:12px;margin-top:18px">Sent from alldentpdr.com live chat</p>
      `,
    });
  } catch (err) {
    console.error('[chat/start] email error:', err);
  }

  return new Response(JSON.stringify({ conversation_id: data }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
};
