export const prerender = false;

import type { APIRoute } from 'astro';

interface VinDecodeResponse {
  Results?: Array<{
    ModelYear?: string;
    Make?: string;
    Model?: string;
    Trim?: string;
    BodyClass?: string;
  }>;
}

function normalizeVin(value: string): string {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const vin = normalizeVin(String(body.vin || ''));
  if (vin.length !== 17) {
    return new Response(JSON.stringify({ error: 'A full 17-character VIN is required' }), { status: 422 });
  }

  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/${encodeURIComponent(vin)}?format=json`);

    if (!response.ok) {
      throw new Error(`VIN decode request failed with status ${response.status}`);
    }

    const data = await response.json() as VinDecodeResponse;
    const vehicle = data.Results?.[0] || {};

    const decodedVehicle = {
      vin,
      year: vehicle.ModelYear || '',
      make: vehicle.Make || '',
      model: vehicle.Model || '',
      trim: vehicle.Trim || '',
      bodyClass: vehicle.BodyClass || '',
    };

    const hasUsefulData = Boolean(decodedVehicle.year || decodedVehicle.make || decodedVehicle.model || decodedVehicle.trim || decodedVehicle.bodyClass);

    if (!hasUsefulData) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'No vehicle details were returned for that VIN',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      ok: true,
      vehicle: decodedVehicle,
      message: [decodedVehicle.year, decodedVehicle.make, decodedVehicle.model].filter(Boolean).join(' ') || 'Vehicle details loaded from VIN',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[vin-decode]', err);
    return new Response(JSON.stringify({ error: 'VIN lookup failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};