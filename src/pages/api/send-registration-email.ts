export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const FROM = 'noreply@alldentpdr.com';
const ADMIN_EMAIL = 'admin@alldentpdr.com';

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { jobId, customerName, email, year, make, model, plate, phone } = body;

  if (!jobId || !customerName || !email) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 422 });
  }

  const vehicleLabel = [year, make, model].filter(Boolean).join(' ') || 'your vehicle';

  try {
    await Promise.all([
      // Confirmation to customer
      resend.emails.send({
        from: FROM,
        to: email,
        subject: `Your AllDent PDR Registration – Job ID ${jobId}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1a1410">
            <div style="background:#b0522b;padding:24px 32px">
              <h1 style="margin:0;color:#fff;font-size:22px">AllDent PDR</h1>
            </div>
            <div style="padding:32px">
              <h2 style="margin-top:0">You're registered, ${escHtml(customerName.split(' ')[0])}!</h2>
              <p>Your vehicle has been registered for paintless dent repair. Here's your confirmation:</p>
              <div style="background:#fffbf6;border:1px solid #e8e0d5;border-radius:8px;padding:20px;margin:20px 0">
                <p style="margin:0 0 8px"><strong>Job ID:</strong> ${escHtml(jobId)}</p>
                <p style="margin:0 0 8px"><strong>Vehicle:</strong> ${escHtml(vehicleLabel)}</p>
                <p style="margin:0 0 8px"><strong>License Plate:</strong> ${plate ? escHtml(plate) : '—'}</p>
                ${phone ? `<p style="margin:0"><strong>Phone on file:</strong> ${escHtml(phone)}</p>` : ''}
              </div>
              <div style="background:#fff3ee;border:1px solid #f5c9b3;border-radius:8px;padding:16px;margin:20px 0">
                <p style="margin:0;font-size:14px"><strong>Track your repair online:</strong> Visit <a href="https://alldentpdr.com/portal/customer-login" style="color:#b0522b">alldentpdr.com/portal/customer-login</a> and log in with your email address and license plate number <strong>${plate ? escHtml(plate) : ''}</strong> to see real-time status updates.</p>
              </div>
              <p>Questions? Call us at <strong>1-855-425-5336</strong> or reply to this email.</p>
              <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e8e0d5;color:#888;font-size:12px">
                <p style="margin:0">AllDent PDR · Mobile Paintless Dent Repair · alldentpdr.com</p>
              </div>
            </div>
          </div>
        `,
      }),

      // Admin notification
      resend.emails.send({
        from: FROM,
        to: ADMIN_EMAIL,
        subject: `New Registration – ${vehicleLabel} (${jobId})`,
        html: `
          <h2>New Vehicle Registration</h2>
          <table style="border-collapse:collapse;width:100%;max-width:600px">
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Job ID</td><td style="padding:8px">${escHtml(jobId)}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Customer</td><td style="padding:8px">${escHtml(customerName)}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Email</td><td style="padding:8px"><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Phone</td><td style="padding:8px">${escHtml(phone || '—')}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Vehicle</td><td style="padding:8px">${escHtml(vehicleLabel)}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Plate</td><td style="padding:8px">${escHtml(plate || '—')}</td></tr>
          </table>
          <p style="margin-top:20px"><a href="https://alldentpdr.com/portal/admin-dashboard">Open Admin Dashboard →</a></p>
        `,
      }),
    ]);

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('[send-registration-email] Resend error:', err);
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
