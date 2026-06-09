import type { APIRoute } from 'astro';
import { GoogleAuth } from 'google-auth-library';

function normalizePrivateKey(privateKey: string) {
  let key = privateKey.trim();

  // Common Vercel copy/paste issue: quoted whole value.
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\n/g, '\n');
}

function shapeServiceAccountCredentials(input: any) {
  if (!input || typeof input !== 'object') return null;

  const clientEmail = input.client_email || import.meta.env.GA_CLIENT_EMAIL;
  const privateKeyRaw = input.private_key || import.meta.env.GA_PRIVATE_KEY;
  const projectId = input.project_id || import.meta.env.GA_PROJECT_ID;

  if (!clientEmail || !privateKeyRaw) return null;

  const privateKey = normalizePrivateKey(privateKeyRaw);

  return {
    type: 'service_account',
    project_id: projectId,
    private_key_id: input.private_key_id || import.meta.env.GA_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: clientEmail,
    client_id: input.client_id || import.meta.env.GA_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      input.client_x509_cert_url ||
      `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
  };
}

function parseServiceAccountCredentials() {
  const rawKeyJson = import.meta.env.GA4_SERVICE_ACCOUNT_KEY;
  const clientEmail = import.meta.env.GA_CLIENT_EMAIL;
  const privateKey = import.meta.env.GA_PRIVATE_KEY;

  if (rawKeyJson) {
    try {
      // Support plain JSON and base64-encoded JSON.
      if (rawKeyJson.trim().startsWith('{')) {
        return shapeServiceAccountCredentials(JSON.parse(rawKeyJson));
      }
      if (rawKeyJson.includes('BEGIN PRIVATE KEY')) {
        return shapeServiceAccountCredentials({
          client_email: clientEmail,
          private_key: rawKeyJson,
        });
      }
      const decoded = Buffer.from(rawKeyJson, 'base64').toString('utf8');
      return shapeServiceAccountCredentials(JSON.parse(decoded));
    } catch {
      // Continue below and try split vars fallback.
    }
  }

  if (clientEmail && privateKey) {
    return shapeServiceAccountCredentials({
      client_email: clientEmail,
      private_key: privateKey,
    });
  }

  return null;
}

export const GET: APIRoute = async () => {
  const propertyId = import.meta.env.GA4_PROPERTY_ID?.trim();
  const credentials = parseServiceAccountCredentials();

  if (!credentials || !propertyId) {
    return new Response(
      JSON.stringify({ error: 'not_configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
    const client   = await auth.getClient();
    const tokenRes = await client.getAccessToken();
    const token    = tokenRes.token;

    const base = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}`;
    const hdrs = {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const [summaryRes, sourcesRes, pagesRes, dailyRes] = await Promise.all([
      // 1 — overall KPIs last 30 days
      fetch(`${base}:runReport`, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
          ],
        }),
      }),
      // 2 — sessions by channel group
      fetch(`${base}:runReport`, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'conversions' },
          ],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10,
        }),
      }),
      // 3 — top pages
      fetch(`${base}:runReport`, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'totalUsers' },
            { name: 'averageSessionDuration' },
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 10,
        }),
      }),
      // 4 — daily sessions for sparkline (last 30 days)
      fetch(`${base}:runReport`, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        }),
      }),
    ]);

    const [summary, sources, pages, daily] = await Promise.all([
      summaryRes.json(),
      sourcesRes.json(),
      pagesRes.json(),
      dailyRes.json(),
    ]);

    const failed = [summaryRes, sourcesRes, pagesRes, dailyRes].find((r) => !r.ok);
    if (failed) {
      const candidate = [summary, sources, pages, daily].find((x: any) => x?.error);
      const details = candidate?.error?.message || `GA4 API error (${failed.status})`;
      return new Response(
        JSON.stringify({ error: details }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ summary, sources, pages, daily }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
