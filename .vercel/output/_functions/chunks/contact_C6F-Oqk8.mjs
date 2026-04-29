import { Resend } from 'resend';

const prerender = false;
const resend = new Resend("re_DPwkzRaz_4iGHPNuSweMKQw3gfyvXiaG5");
const FROM = "noreply@alldentpdr.com";
const ADMIN_EMAIL = "alldentpdr@gmail.com";
const POST = async ({ request }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }
  const { name, email, location, vehicle, message } = body;
  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 422 });
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
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Location</td><td style="padding:8px">${escHtml(location || "—")}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Vehicle</td><td style="padding:8px">${escHtml(vehicle || "—")}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;vertical-align:top">Message</td><td style="padding:8px;white-space:pre-wrap">${escHtml(message)}</td></tr>
        </table>
        <p style="margin-top:20px;color:#888;font-size:12px">Sent from alldentpdr.com contact form</p>
      `
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("[contact] Resend error:", err);
    return new Response(JSON.stringify({ error: "Email delivery failed" }), { status: 500 });
  }
};
function escHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
