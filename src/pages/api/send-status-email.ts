export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const FROM = 'noreply@alldentpdr.com';

const STATUS_MESSAGES: Record<string, { headline: string; body: string; color: string }> = {
  'In Progress': {
    headline: 'Your repair is underway!',
    body: "Great news — your vehicle is now actively being worked on by our PDR technicians. We'll notify you again when it's complete.",
    color: '#4a7a5c',
  },
  Complete: {
    headline: 'Your repair is complete!',
    body: 'Your vehicle repair has been finished. Thank you for choosing AllDent PDR. If you have any questions about the work performed, please don\'t hesitate to reach out.',
    color: '#2563eb',
  },
  Registered: {
    headline: 'Your registration has been confirmed.',
    body: "We've received your vehicle registration. Our team will be in touch shortly to schedule your repair appointment.",
    color: '#b0522b',
  },
};

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { jobId, customerName, email, status, year, make, model, plate } = body;

  if (!jobId || !customerName || !email || !status) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 422 });
  }

  const msg = STATUS_MESSAGES[status] ?? {
    headline: `Status updated to: ${status}`,
    body: `Your vehicle repair status has been updated to <strong>${escHtml(status)}</strong>.`,
    color: '#b0522b',
  };

  const vehicleLabel = [year, make, model].filter(Boolean).join(' ') || 'your vehicle';

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `AllDent PDR Update – ${status} (Job ${jobId})`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1a1410">
          <div style="background:#b0522b;padding:24px 32px">
            <h1 style="margin:0;color:#fff;font-size:22px">AllDent PDR</h1>
          </div>
          <div style="padding:32px">
            <div style="display:inline-block;background:${msg.color};color:#fff;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:16px">${escHtml(status)}</div>
            <h2 style="margin-top:0">${msg.headline}</h2>
            <p>${msg.body}</p>
            <div style="background:#fffbf6;border:1px solid #e8e0d5;border-radius:8px;padding:20px;margin:20px 0">
              <p style="margin:0 0 8px"><strong>Job ID:</strong> ${escHtml(jobId)}</p>
              <p style="margin:0 0 8px"><strong>Customer:</strong> ${escHtml(customerName)}</p>
              <p style="margin:0 0 8px"><strong>Vehicle:</strong> ${escHtml(vehicleLabel)}</p>
              ${plate ? `<p style="margin:0"><strong>Plate:</strong> ${escHtml(plate)}</p>` : ''}
            </div>
            <p>Track your repair anytime at <a href="https://alldentpdr.com/portal/customer-login" style="color:#b0522b">alldentpdr.com/portal/customer-login</a>.</p>
            <p>Questions? Call us at <strong>1-855-425-5336</strong>.</p>
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e8e0d5;color:#888;font-size:12px">
              <p style="margin:0">AllDent PDR · Mobile Paintless Dent Repair · alldentpdr.com</p>
            </div>
          </div>
        </div>
      `,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('[send-status-email] Resend error:', err);
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
