export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const FROM   = 'noreply@alldentpdr.com';

// Server-side Supabase client using the service-role key so we can
// read and update all rows regardless of RLS policies.
const supabaseUrl     = import.meta.env.PUBLIC_SUPABASE_URL as string;
const supabaseService = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string;

const CRON_SECRET = import.meta.env.CRON_SECRET as string | undefined;
const REMINDER_HOURS = 48;

// Statuses where we keep reminding the customer (not Complete)
const REMINDER_STATUSES = ['Estimate', 'Pending Insurance', 'In Repair', 'On Hold'];

const STATUS_MESSAGES: Record<string, { headline: string; body: string; color: string }> = {
  'Estimate': {
    headline: 'Reminder: Your estimate is still awaiting your approval.',
    body: "This is a friendly reminder that your estimate is ready and waiting for your response. Call us at 1-855-425-5336 or reply to this email and we'll get your repair scheduled right away.",
    color: '#fc1317',
  },
  'Pending Insurance': {
    headline: 'Update: Your insurance claim is still in progress.',
    body: "We're still working with your insurance company to get your claim approved. If you have your claim number handy, feel free to call us at 1-855-425-5336 to check on progress together.",
    color: '#6a5acd',
  },
  'In Repair': {
    headline: 'Update: Your vehicle is still in our shop.',
    body: 'Your vehicle is still actively being repaired by our PDR technicians. We will notify you as soon as the work is finished.',
    color: '#0a71d0',
  },
  'On Hold': {
    headline: 'Update: Your repair is currently on hold.',
    body: "Your repair is temporarily on hold. We appreciate your patience and will notify you as soon as we are ready to proceed.",
    color: '#d97706',
  },
};

function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const GET: APIRoute = async ({ request }) => {
  // Verify the request comes from Vercel Cron (or manual call with secret)
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!supabaseUrl || !supabaseService) {
    return new Response(JSON.stringify({ skipped: true, reason: 'Supabase not configured' }), { status: 200 });
  }

  const supabase = createClient(supabaseUrl, supabaseService);

  const cutoff = new Date(Date.now() - REMINDER_HOURS * 60 * 60 * 1000).toISOString();

  // Find jobs that:
  // 1. Are in an active (non-complete) status
  // 2. Have notifications enabled
  // 3. Have not been notified in the last 48 hours (or never notified)
  const { data: jobs, error } = await supabase
    .from('vehicle_jobs')
    .select('id, customer_name, email, status, year, make, model, plate, last_notified_at, notifications_enabled')
    .in('status', REMINDER_STATUSES)
    .eq('notifications_enabled', true)
    .or(`last_notified_at.is.null,last_notified_at.lt.${cutoff}`);

  if (error) {
    console.error('[cron/status-reminder] Supabase error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results: { id: string; status: 'sent' | 'skipped'; email?: string }[] = [];

  for (const job of jobs || []) {
    const msg = STATUS_MESSAGES[job.status];
    if (!msg || !job.email) {
      results.push({ id: job.id, status: 'skipped' });
      continue;
    }

    const vehicleLabel = [job.year, job.make, job.model].filter(Boolean).join(' ') || 'your vehicle';

    try {
      await resend.emails.send({
        from: FROM,
        to: job.email,
        subject: `All Dent PDR Update – ${job.status} (Job ${job.id})`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1a1410">
            <div style="background:#fc1317;padding:24px 32px">
              <h1 style="margin:0;color:#fff;font-size:22px">All Dent PDR</h1>
            </div>
            <div style="padding:32px">
              <div style="display:inline-block;background:${msg.color};color:#fff;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:16px">${escHtml(job.status)}</div>
              <h2 style="margin-top:0">${msg.headline}</h2>
              <p>${msg.body}</p>
              <div style="background:#fffbf6;border:1px solid #e8e0d5;border-radius:8px;padding:20px;margin:20px 0">
                <p style="margin:0 0 8px"><strong>Job ID:</strong> ${escHtml(job.id)}</p>
                <p style="margin:0 0 8px"><strong>Customer:</strong> ${escHtml(job.customer_name)}</p>
                <p style="margin:0 0 8px"><strong>Vehicle:</strong> ${escHtml(vehicleLabel)}</p>
                ${job.plate ? `<p style="margin:0"><strong>Plate:</strong> ${escHtml(job.plate)}</p>` : ''}
              </div>
              <p>Track your repair anytime at <a href="https://alldentpdr.com/portal/customer-login" style="color:#fc1317">alldentpdr.com/portal/customer-login</a>.</p>
              <p>Questions? Call us at <strong>1-855-425-5336</strong>.</p>
              <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e8e0d5;color:#888;font-size:12px">
                <p style="margin:0">All Dent PDR &middot; 7695 Granger Rd, Cleveland, OH 44125 &middot; alldentpdr.com</p>
              </div>
            </div>
          </div>
        `,
      });

      // Update last_notified_at so we don't send again for another 48 hours
      await supabase
        .from('vehicle_jobs')
        .update({ last_notified_at: new Date().toISOString() })
        .eq('id', job.id);

      results.push({ id: job.id, status: 'sent', email: job.email });
    } catch (err) {
      console.error(`[cron/status-reminder] Failed to send for ${job.id}:`, err);
      results.push({ id: job.id, status: 'skipped' });
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), { status: 200 });
};
