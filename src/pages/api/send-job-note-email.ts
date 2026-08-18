export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const FROM = 'noreply@alldentpdr.com';

interface JobNoteBody {
  jobId: string;
  customerName: string;
  email: string;
  status: string;
  year: string;
  make: string;
  model: string;
  plate: string;
  note: string;
}

function escHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const POST: APIRoute = async ({ request }) => {
  let body: JobNoteBody;
  try {
    body = await request.json() as JobNoteBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { jobId, customerName, email, status, year, make, model, plate, note } = body;

  if (!jobId || !customerName || !email || !note?.trim()) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 422 });
  }

  const vehicleLabel = [year, make, model].filter(Boolean).join(' ') || 'your vehicle';

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      bcc: 'alldentpdr@gmail.com',
      subject: `All Dent PDR Update — Job ${jobId}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1a1410">
          <div style="background:#fc1317;padding:24px 32px">
            <h1 style="margin:0;color:#fff;font-size:22px">All Dent PDR</h1>
          </div>
          <div style="padding:32px">
            <div style="display:inline-block;background:#0a71d0;color:#fff;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:16px">${escHtml(status || 'Update')}</div>
            <h2 style="margin-top:0">Update on your repair</h2>
            <p>Hi ${escHtml(customerName)}, our team added a new note about ${escHtml(vehicleLabel)}:</p>
            <div style="background:#fff8f0;border-left:4px solid #fc1317;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#fc1317">Note from our team</p>
              <p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap">${escHtml(note.trim())}</p>
            </div>
            <div style="background:#fffbf6;border:1px solid #e8e0d5;border-radius:8px;padding:20px;margin:20px 0">
              <p style="margin:0 0 8px"><strong>Job ID:</strong> ${escHtml(jobId)}</p>
              <p style="margin:0 0 8px"><strong>Vehicle:</strong> ${escHtml(vehicleLabel)}</p>
              ${plate ? `<p style="margin:0"><strong>Plate:</strong> ${escHtml(plate)}</p>` : ''}
            </div>
            <p>Track your repair anytime at <a href="https://alldentpdr.com/portal/customer-login" style="color:#fc1317">alldentpdr.com/portal/customer-login</a>.</p>
            <p>Questions? Call us at <strong>1-855-425-5336</strong>.</p>
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e8e0d5;color:#888;font-size:12px">
              <p style="margin:0">All Dent PDR · Paintless Dent Repair Shop · alldentpdr.com</p>
            </div>
          </div>
        </div>
      `,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('[send-job-note-email] Resend error:', err);
    return new Response(JSON.stringify({ error: 'Email delivery failed' }), { status: 500 });
  }
};
