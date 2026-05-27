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

// Throttle notification emails: only one per conversation per N minutes
const NOTIFY_COOLDOWN_MS = 5 * 60 * 1000;
const lastNotify = new Map<string, number>();

export const POST: APIRoute = async ({ request }) => {
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Chat unavailable' }), { status: 503 });
  }

  let body: Record<string, string>;
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 }); }

  const token = (body.token || '').trim();
  const message = (body.message || '').trim();

  if (token.length < 16) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400 });
  }
  if (!message) {
    return new Response(JSON.stringify({ error: 'Message required' }), { status: 422 });
  }
  if (message.length > 4000) {
    return new Response(JSON.stringify({ error: 'Message too long' }), { status: 422 });
  }

  const { data: msgId, error } = await supabase.rpc('chat_send_visitor_message', {
    p_token: token,
    p_body: message,
  });

  if (error) {
    console.error('[chat/send] rpc error:', error.message);
    return new Response(JSON.stringify({ error: 'Could not send message' }), { status: 500 });
  }

  // Throttled admin email notification
  const now = Date.now();
  const last = lastNotify.get(token) || 0;
  if (now - last > NOTIFY_COOLDOWN_MS) {
    lastNotify.set(token, now);
    try {
      await resend.emails.send({
        from: FROM,
        to: ADMIN_EMAIL,
        subject: `💬 New chat message from visitor`,
        html: `
          <h2>New live chat message</h2>
          <blockquote style="border-left:4px solid #fc1317;padding:10px 14px;background:#fffbf6;white-space:pre-wrap;margin:14px 0">${esc(message)}</blockquote>
          <p>
            <a href="https://alldentpdr.com/portal/admin-dashboard?view=messages"
               style="background:#fc1317;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">
              Reply in admin dashboard →
            </a>
          </p>
          <p style="color:#888;font-size:12px;margin-top:14px">
            Further messages in this conversation within the next ${NOTIFY_COOLDOWN_MS / 60000} minutes won't trigger additional emails.
          </p>
        `,
      });
    } catch (err) {
      console.error('[chat/send] email error:', err);
    }
  }

  return new Response(JSON.stringify({ id: msgId }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
};
