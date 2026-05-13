export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const FROM   = 'noreply@alldentpdr.com';

interface ReleaseBody {
  jobId:        string;
  customerName: string;
  email:        string;
  year:         string;
  make:         string;
  model:        string;
  vin:          string;
  deductible:   string;
  paid:         string;
  notes:        string;
  custSig:      string;
  signedAt:     string;
  witnessedBy:  string;
  witnessedAt:  string;
}

function escHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const POST: APIRoute = async ({ request }) => {
  let body: ReleaseBody;
  try {
    body = await request.json() as ReleaseBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const {
    jobId, customerName, email,
    year, make, model, vin,
    deductible, paid, notes,
    custSig, signedAt, witnessedBy, witnessedAt,
  } = body;

  if (!email) {
    return new Response(JSON.stringify({ error: 'Customer email is required' }), { status: 422 });
  }

  const vehicle = [year, make, model].filter(Boolean).join(' ') || '—';

  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:8px 12px;font-weight:600;font-size:12px;color:#9e8f84;text-transform:uppercase;letter-spacing:.04em;width:130px;white-space:nowrap;border-bottom:1px solid #f0ebe6">${escHtml(label)}</td>
      <td style="padding:8px 12px;font-size:13.5px;border-bottom:1px solid #f0ebe6">${escHtml(value || '—')}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:system-ui,-apple-system,sans-serif;color:#1a1410">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:#b0522b;padding:28px 32px">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px">AllDent PDR</div>
      <div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:2px">Mobile Paintless Dent Repair</div>
      <div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:6px">855-425-5336 · alldentpdr@gmail.com</div>
    </div>

    <!-- Title -->
    <div style="padding:24px 32px 0">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#b0522b;margin-bottom:6px">Job ${escHtml(jobId)}</div>
      <h2 style="margin:0 0 4px;font-size:20px;font-weight:800;color:#1a1410">Vehicle Release Form</h2>
      <p style="margin:0;font-size:13px;color:#9e8f84">Your vehicle has been repaired. Please review and retain this form for your records.</p>
    </div>

    <!-- Vehicle / Customer info -->
    <div style="padding:20px 32px 0">
      <table style="width:100%;border-collapse:collapse;background:#fffbf6;border-radius:8px;overflow:hidden;border:1px solid #e8e2db">
        ${row('Customer', customerName)}
        ${row('Vehicle', vehicle)}
        ${row('VIN', vin)}
        ${row('Deductible', deductible)}
        ${row('Paid', paid)}
      </table>
    </div>

    ${notes ? `
    <!-- Notes -->
    <div style="padding:20px 32px 0">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9e8f84;margin-bottom:6px">Repair Notes</div>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#1a1410;background:#fffbf6;border:1px solid #e8e2db;border-radius:8px;padding:12px 14px;white-space:pre-wrap">${escHtml(notes)}</p>
    </div>` : ''}

    <!-- Agreement text -->
    <div style="padding:20px 32px 0">
      <p style="margin:0;font-size:13px;line-height:1.7;color:#1a1410;background:#fffbf6;border-left:3px solid #b0522b;padding:14px 16px;border-radius:0 8px 8px 0">
        The repairs on the vehicle listed above have been completed, as explained to me by All Dent PDR.
        I am fully satisfied with the outcome of the repairs on the vehicle listed above. I understand
        the limited lifetime warranty, and payment for the work has been paid in full.
      </p>
    </div>

    <!-- Signatures -->
    <div style="padding:20px 32px 0">
      <div style="display:flex;gap:24px;flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9e8f84;margin-bottom:4px">Customer Signature</div>
          <div style="font-size:16px;font-style:italic;border-bottom:1px solid #1a1410;padding-bottom:4px;min-height:28px">${escHtml(custSig)}</div>
          <div style="font-size:11px;color:#9e8f84;margin-top:4px">Date: ${escHtml(signedAt)}</div>
        </div>
        <div style="flex:1;min-width:200px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9e8f84;margin-bottom:4px">Witnessed By</div>
          <div style="font-size:16px;font-style:italic;border-bottom:1px solid #1a1410;padding-bottom:4px;min-height:28px">${escHtml(witnessedBy)}</div>
          <div style="font-size:11px;color:#9e8f84;margin-top:4px">Date: ${escHtml(witnessedAt)}</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin:28px 32px 32px;padding-top:20px;border-top:1px solid #e8e2db;text-align:center;font-size:11px;color:#9e8f84;line-height:1.8">
      <strong style="color:#1a1410">AllDent PDR · Mobile Paintless Dent Repair</strong><br/>
      1-855-425-5336 · alldentpdr.com · alldentpdr@gmail.com
    </div>
  </div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      bcc: 'alldentpdr@gmail.com',
      subject: `Vehicle Release — ${vehicle} (Job ${jobId})`,
      html,
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[send-release-email]', err);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
