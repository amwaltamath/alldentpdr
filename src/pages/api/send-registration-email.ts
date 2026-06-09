export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { sendCapiEvent } from '../../lib/meta-capi';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const FROM = 'noreply@alldentpdr.com';
const ADMIN_EMAIL = 'admin@alldentpdr.com';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const {
    jobId, customerName, email,
    phone = '', homePhone = '', address = '', city = '', state = '', zip = '',
    year = '', make = '', model = '', plate = '', vin = '', color = '',
    insuranceCompany = '', deductible = '', claimNumber = '',
    notes = '', howHeard = '',
    directionToPaySigned, repairAuthSigned, insuranceAuthName = '', signatureName = '', signedAt = '',
  } = body;

  if (!jobId || !customerName || !email) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 422 });
  }

  const vehicleLabel = [year, make, model].filter(Boolean).join(' ') || 'your vehicle';
  const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
  const signedAtDisplay = signedAt ? new Date(signedAt).toLocaleString('en-US', { timeZoneName: 'short' }) : '—';
  const dtpCheck = directionToPaySigned ? '&#9989;' : '&#9744;';
  const raCheck  = repairAuthSigned     ? '&#9989;' : '&#9744;';

  function row(label: string, value: string) {
    if (!value || value === '—') return '';
    return `<tr>
      <td style="padding:8px 12px;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;background:#faf7f4;border-bottom:1px solid #ede8e2">${label}</td>
      <td style="padding:8px 12px;color:#1a1410;border-bottom:1px solid #ede8e2">${escHtml(value)}</td>
    </tr>`;
  }

  try {
    await Promise.all([
      // ── Confirmation to customer ───────────────────────────────────────────
      resend.emails.send({
        from: FROM,
        to: email,
        subject: `Your All Dent PDR Registration – Job ID ${jobId}`,
        html: `
<div style="font-family:system-ui,sans-serif;max-width:620px;margin:0 auto;color:#1a1410">
  <!-- Header -->
  <div style="background:#fc1317;padding:24px 32px">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">All Dent PDR</h1>
    <p style="margin:4px 0 0;color:#f5c9b3;font-size:13px">Paintless Dent Repair Shop</p>
  </div>

  <div style="padding:32px">
    <h2 style="margin:0 0 8px">You're registered, ${escHtml(customerName.split(' ')[0])}!</h2>
    <p style="margin:0 0 20px;color:#555">This is your full copy of the registration on file. Please save this email for your records.</p>

    <!-- Job ID banner -->
    <div style="background:#fc1317;color:#fff;border-radius:8px;padding:14px 20px;margin-bottom:24px;display:flex;align-items:center;gap:16px">
      <div>
        <div style="font-size:11px;opacity:.8;text-transform:uppercase;letter-spacing:.05em">Job ID</div>
        <div style="font-size:22px;font-weight:700;font-family:monospace;letter-spacing:.08em">${escHtml(jobId)}</div>
      </div>
      <div style="margin-left:auto;font-size:13px;opacity:.85">Status: Estimate</div>
    </div>

    <!-- ── Customer Info ── -->
    <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#fc1317">Customer Information</h3>
    <table style="border-collapse:collapse;width:100%;margin-bottom:20px;border:1px solid #ede8e2;border-radius:8px;overflow:hidden">
      ${row('Name', customerName)}
      ${row('Email', email)}
      ${row('Cell Phone', phone)}
      ${row('Home Phone', homePhone)}
      ${row('Address', fullAddress)}
      ${row('How heard', howHeard)}
    </table>

    <!-- ── Vehicle Info ── -->
    <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#fc1317">Vehicle</h3>
    <table style="border-collapse:collapse;width:100%;margin-bottom:20px;border:1px solid #ede8e2;border-radius:8px;overflow:hidden">
      ${row('Year / Make / Model', vehicleLabel)}
      ${row('License Plate', plate)}
      ${row('Color', color)}
      ${row('VIN', vin)}
    </table>

    <!-- ── Insurance ── -->
    ${(insuranceCompany || deductible || claimNumber) ? `
    <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#fc1317">Insurance</h3>
    <table style="border-collapse:collapse;width:100%;margin-bottom:20px;border:1px solid #ede8e2;border-radius:8px;overflow:hidden">
      ${row('Insurance Company', insuranceCompany)}
      ${row('Deductible', deductible)}
      ${row('Claim Number', claimNumber)}
      ${row('Auth / Name', insuranceAuthName)}
    </table>` : ''}

    <!-- ── Notes ── -->
    ${notes ? `
    <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#fc1317">Notes</h3>
    <div style="background:#faf7f4;border:1px solid #ede8e2;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:14px;color:#444">${escHtml(notes)}</div>` : ''}

    <!-- ── Authorization ── -->
    <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#fc1317">Authorization Agreements</h3>
    <div style="background:#faf7f4;border:1px solid #ede8e2;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <p style="margin:0 0 10px;font-size:14px">${dtpCheck} <strong>Direction to Pay</strong> — I authorize All Dent PDR to collect payment directly from my insurance carrier.</p>
      <p style="margin:0 0 14px;font-size:14px">${raCheck} <strong>Repair Authorization</strong> — I authorize All Dent PDR to perform paintless dent repair on my vehicle.</p>
      <table style="border-collapse:collapse;width:100%">
        ${row('Signature Name', signatureName)}
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#555;white-space:nowrap;background:#faf7f4;border-bottom:1px solid #ede8e2">Electronically Signed</td>
          <td style="padding:8px 12px;border-bottom:1px solid #ede8e2;font-family:monospace;font-size:13px">${escHtml(signedAtDisplay)}</td>
        </tr>
      </table>
      <p style="margin:12px 0 0;font-size:11px;color:#888">This constitutes your electronic signature. The exact UTC timestamp (<code>${escHtml(signedAt || '—')}</code>) has been recorded for legal purposes.</p>
    </div>

    <!-- ── Track online ── -->
    <div style="background:#fff3ee;border:2px solid #f5c9b3;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0;font-size:14px"><strong>Track your repair online:</strong> Visit <a href="https://alldentpdr.com/portal/customer-login" style="color:#fc1317">alldentpdr.com/portal/customer-login</a> and log in with your email and license plate <strong>${plate ? escHtml(plate) : ''}</strong> to see real-time status updates.</p>
    </div>

    <p style="color:#555">Questions? Call us at <strong>1-855-425-5336</strong> or reply to this email.</p>

    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e8e0d5;color:#aaa;font-size:12px">
      <p style="margin:0">All Dent PDR · Paintless Dent Repair Shop · alldentpdr.com</p>
    </div>
  </div>
</div>`,
      }),

      // ── Admin notification ─────────────────────────────────────────────────
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
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Insurance</td><td style="padding:8px">${escHtml(insuranceCompany || '—')}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Signed</td><td style="padding:8px">${escHtml(signedAtDisplay)}</td></tr>
          </table>
          <p style="margin-top:20px"><a href="https://alldentpdr.com/portal/admin-dashboard">Open Admin Dashboard →</a></p>
        `,
      }),
    ]);

    // Fire Meta Conversions API CompleteRegistration event (best-effort, non-blocking)
    const nameParts = customerName.trim().split(/\s+/);
    const userAgent = request.headers.get('user-agent') ?? undefined;
    sendCapiEvent({
      eventName:      'CompleteRegistration',
      eventSourceUrl: 'https://alldentpdr.com/register',
      userData: {
        email,
        phone:     phone || undefined,
        firstName: nameParts[0],
        lastName:  nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined,
        city:      city  || undefined,
        state:     state || undefined,
        zip:       zip   || undefined,
        clientIp:  clientAddress,
        userAgent,
        fbc:       body.fbc || undefined,
        fbp:       body.fbp || undefined,
      },
      customData: {
        content_name:      vehicleLabel,
        registration_id:   jobId,
        insurance_company: insuranceCompany || undefined,
      },
    });

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
