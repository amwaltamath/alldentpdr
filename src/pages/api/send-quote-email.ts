export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const FROM   = 'noreply@alldentpdr.com';

interface PanelRow {
  label:  string;
  method: string;
  dents:  string | number;
  size:   string;
  price:  string | number;
}

interface QuoteBody {
  customerName:      string;
  customerEmail:     string;
  year:              string;
  make:              string;
  model:             string;
  color:             string;
  plate:             string;
  vin:               string;
  insuranceCompany:  string;
  claimNumber:       string;
  notes:             string;
  total:             number;
  panels:            PanelRow[];
}

function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(n: number | string): string {
  const num = parseFloat(String(n));
  return isNaN(num) ? '—' : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const METHOD_COLORS: Record<string, { bg: string; fg: string }> = {
  PDR:  { bg: '#e6f2ec', fg: '#2d6b47' },
  'R&I': { bg: '#fff3e0', fg: '#b56a00' },
  'R&R': { bg: '#fdecea', fg: '#c0392b' },
};

export const POST: APIRoute = async ({ request }) => {
  let body: QuoteBody;
  try {
    body = await request.json() as QuoteBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const {
    customerName, customerEmail,
    year, make, model, color, plate, vin,
    insuranceCompany, claimNumber,
    notes, total, panels,
  } = body;

  if (!customerEmail) {
    return new Response(JSON.stringify({ error: 'Customer email is required' }), { status: 422 });
  }

  const dateStr   = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const quoteNum  = `AQ-${Date.now().toString().slice(-6)}`;
  const vehicle   = [year, make, model].filter(Boolean).join(' ') || '—';

  const panelRows = panels.map((p) => {
    const mc     = METHOD_COLORS[p.method] ?? { bg: '#f0f0f0', fg: '#333' };
    const isRR   = p.method === 'R&R';
    const badge  = `<span style="display:inline-block;background:${mc.bg};color:${mc.fg};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:.03em">${escHtml(p.method)}</span>`;
    return `
      <tr>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e2db;vertical-align:middle">${escHtml(p.label)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e2db;text-align:center">${badge}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e2db;text-align:center">${!isRR && p.dents ? escHtml(String(p.dents)) : '—'}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e2db;text-align:center">${!isRR && p.size ? escHtml(p.size) : '—'}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e2db;text-align:right;font-weight:600">${p.price ? fmtMoney(p.price) : '—'}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:system-ui,-apple-system,sans-serif;color:#1a1410">
  <div style="max-width:620px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:#b0522b;padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px">All Dent PDR</div>
        <div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:2px">Mobile Paintless Dent Repair</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:700;color:#fff">${escHtml(quoteNum)}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:2px">${escHtml(dateStr)}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.75)">Valid 30 days</div>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px">
      <p style="margin:0 0 20px;font-size:15px">Hi ${customerName ? escHtml(customerName) : 'there'},</p>
      <p style="margin:0 0 24px;line-height:1.6;color:#4a3f36">
        Here is your paintless dent repair estimate from All Dent PDR. Please review the details below.
        This estimate is valid for <strong>30 days</strong> from the date above.
      </p>

      <!-- Info cards -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>
          <td style="width:33%;vertical-align:top;padding-right:8px">
            <div style="background:#fffbf6;border:1px solid #e8e2db;border-radius:8px;padding:12px 14px">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9e8f84;margin-bottom:6px">Customer</div>
              <div style="font-size:13px;line-height:1.6">${customerName ? escHtml(customerName) : '<span style="color:#aaa">—</span>'}</div>
            </div>
          </td>
          <td style="width:33%;vertical-align:top;padding:0 4px">
            <div style="background:#fffbf6;border:1px solid #e8e2db;border-radius:8px;padding:12px 14px">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9e8f84;margin-bottom:6px">Vehicle</div>
              <div style="font-size:13px;line-height:1.6">
                ${escHtml(vehicle)}
                ${color  ? `<br/><span style="color:#9e8f84">Color:</span> ${escHtml(color)}` : ''}
                ${plate  ? `<br/><span style="color:#9e8f84">Plate:</span> ${escHtml(plate)}` : ''}
                ${vin    ? `<br/><span style="font-family:monospace;font-size:11px;color:#9e8f84">VIN:</span> <span style="font-family:monospace;font-size:11px">${escHtml(vin)}</span>` : ''}
              </div>
            </div>
          </td>
          <td style="width:33%;vertical-align:top;padding-left:8px">
            <div style="background:#fffbf6;border:1px solid #e8e2db;border-radius:8px;padding:12px 14px">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9e8f84;margin-bottom:6px">Insurance</div>
              <div style="font-size:13px;line-height:1.6">
                ${insuranceCompany ? escHtml(insuranceCompany) : '<span style="color:#aaa">—</span>'}
                ${claimNumber ? `<br/><span style="color:#9e8f84">Claim #:</span> ${escHtml(claimNumber)}` : ''}
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Panel table -->
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9e8f84;padding-bottom:6px;border-bottom:1px solid #e8e2db;margin-bottom:0">Panel Assessment</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px">
        <thead>
          <tr style="background:#b0522b">
            <th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;letter-spacing:.05em;color:#fff">Panel</th>
            <th style="padding:8px 10px;text-align:center;font-size:11px;font-weight:700;letter-spacing:.05em;color:#fff">Method</th>
            <th style="padding:8px 10px;text-align:center;font-size:11px;font-weight:700;letter-spacing:.05em;color:#fff">Dents</th>
            <th style="padding:8px 10px;text-align:center;font-size:11px;font-weight:700;letter-spacing:.05em;color:#fff">Size</th>
            <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;letter-spacing:.05em;color:#fff">Price</th>
          </tr>
        </thead>
        <tbody>
          ${panelRows || '<tr><td colspan="5" style="text-align:center;color:#9e8f84;padding:20px">No panels marked as affected.</td></tr>'}
          <tr>
            <td colspan="4" style="padding:10px;font-weight:700;font-size:14px;background:#fff3ee;border-top:2px solid #b0522b">Estimated Total</td>
            <td style="padding:10px;font-weight:700;font-size:18px;color:#b0522b;text-align:right;background:#fff3ee;border-top:2px solid #b0522b">${fmtMoney(total)}</td>
          </tr>
        </tbody>
      </table>

      ${notes ? `
      <div style="background:#fffbf6;border:1px solid #e8e2db;border-radius:8px;padding:14px;margin-bottom:24px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9e8f84;margin-bottom:6px">Notes / Exclusions</div>
        <p style="font-size:13px;line-height:1.6;white-space:pre-wrap;margin:0">${escHtml(notes)}</p>
      </div>` : ''}

      <p style="line-height:1.6;color:#4a3f36;margin-bottom:24px">
        Questions about your estimate? Call us at <strong>1-855-425-5336</strong> or reply to this email.
        We're happy to schedule an appointment at a time and location that works for you.
      </p>

      <div style="text-align:center;margin-bottom:8px">
        <a href="tel:18554255336" style="display:inline-block;background:#b0522b;color:#fff;padding:12px 28px;border-radius:24px;font-weight:700;text-decoration:none;font-size:15px">
          Call to Schedule
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f6efe7;border-top:1px solid #e8e2db;padding:20px 32px;text-align:center;font-size:11px;color:#9e8f84;line-height:1.8">
      <strong style="color:#4a3f36">All Dent PDR &middot; Mobile Paintless Dent Repair</strong><br/>
      1-855-425-5336 &middot; <a href="https://alldentpdr.com" style="color:#b0522b">alldentpdr.com</a> &middot; alldentpdr@gmail.com<br/>
      This estimate is valid for 30 days. Prices subject to change upon physical inspection.<br/>
      Method key: PDR = Paintless Dent Repair &nbsp;|&nbsp; R&amp;I = Remove &amp; Install &nbsp;|&nbsp; R&amp;R = Remove &amp; Replace
    </div>
  </div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from:    FROM,
      to:      customerEmail,
      subject: `Your All Dent PDR Estimate – ${quoteNum} (${vehicle})`,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('[send-quote-email] Resend error:', err);
    return new Response(JSON.stringify({ error: 'Email delivery failed' }), { status: 500 });
  }
};
