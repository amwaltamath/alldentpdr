import type { APIRoute } from 'astro';
import { GoogleAuth } from 'google-auth-library';

export const GET: APIRoute = async () => {
  const keyJson    = import.meta.env.GA4_SERVICE_ACCOUNT_KEY;
  const propertyId = import.meta.env.GA4_PROPERTY_ID;

  if (!keyJson || !propertyId) {
    return new Response(
      JSON.stringify({ error: 'not_configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const credentials = JSON.parse(keyJson);
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
