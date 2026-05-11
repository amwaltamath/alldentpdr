import { isSupabaseEnabled, supabase } from './supabaseClient';

const VEHICLES_KEY = 'alldentpdr_vehicles';
const SESSION_KEY = 'alldentpdr_portal_session';
const PRICING_KEY = 'alldentpdr_pricing_v1';

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapRemoteVehicle(item) {
  return {
    id: item.id,
    customerName: item.customer_name,
    email: item.email,
    phone: item.phone || '',
    homePhone: item.home_phone || '',
    address: item.address || '',
    city: item.city || '',
    state: item.state || '',
    zip: item.zip || '',
    howHeardAboutUs: item.how_heard || item.how_heard_about_us || '',
    insuranceCompany: item.insurance_company || '',
    deductible: item.deductible || '',
    claimNumber: item.claim_number || '',
    year: item.year,
    make: item.make,
    model: item.model,
    vin: item.vin || '',
    color: item.color || '',
    plate: item.plate,
    status: item.status,
    notes: item.notes || '',
    notificationsEnabled: Boolean(item.notifications_enabled),
    notificationChannel: item.notification_channel || 'email',
    directionToPaySigned: Boolean(item.direction_to_pay_signed),
    repairAuthSigned: Boolean(item.repair_auth_signed),
    insuranceAuthName: item.insurance_auth_name || '',
    signatureName: item.signature_name || '',
    signedAt: item.signed_at || null,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
}

function getLocalVehicles() {
  if (typeof window === 'undefined') return [];
  return parseJson(localStorage.getItem(VEHICLES_KEY) || '[]', []);
}

function saveLocalVehicles(vehicles) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
}

function normalizeLocalVehicle(vehicle) {
  return {
    ...vehicle,
    notificationsEnabled: Boolean(vehicle.notificationsEnabled),
    notificationChannel: vehicle.notificationChannel || 'email'
  };
}

function buildVehicleRecord(vehicle) {
  const now = new Date().toISOString();
  const id = `AD-${Date.now().toString().slice(-6)}`;
  return {
    id,
    customerName: vehicle.customerName.trim(),
    email: vehicle.email.trim().toLowerCase(),
    phone: (vehicle.phone || '').trim(),
    homePhone: (vehicle.homePhone || '').trim(),
    address: (vehicle.address || '').trim(),
    city: (vehicle.city || '').trim(),
    state: (vehicle.state || '').trim().toUpperCase(),
    zip: (vehicle.zip || '').trim(),
    howHeardAboutUs: (vehicle.howHeardAboutUs || '').trim(),
    insuranceCompany: (vehicle.insuranceCompany || '').trim(),
    deductible: (vehicle.deductible || '').trim(),
    claimNumber: (vehicle.claimNumber || '').trim(),
    year: vehicle.year.trim(),
    make: vehicle.make.trim(),
    model: vehicle.model.trim(),
    vin: (vehicle.vin || '').trim().toUpperCase(),
    color: (vehicle.color || '').trim(),
    plate: vehicle.plate.trim().toUpperCase(),
    status: vehicle.status || 'Registered',
    notes: (vehicle.notes || '').trim(),
    notificationsEnabled: Boolean(vehicle.notificationsEnabled),
    notificationChannel: vehicle.notificationChannel || 'email',
    createdAt: now,
    updatedAt: now
  };
}

function mapRemotePayload(vehicle) {
  return {
    id: vehicle.id,
    customer_name: vehicle.customerName,
    email: vehicle.email,
    phone: vehicle.phone,
    home_phone: vehicle.homePhone,
    address: vehicle.address,
    city: vehicle.city,
    state: vehicle.state,
    zip: vehicle.zip,
    how_heard_about_us: vehicle.howHeardAboutUs,
    insurance_company: vehicle.insuranceCompany,
    deductible: vehicle.deductible,
    claim_number: vehicle.claimNumber,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    vin: vehicle.vin,
    color: vehicle.color,
    plate: vehicle.plate,
    status: vehicle.status,
    notes: vehicle.notes,
    notifications_enabled: vehicle.notificationsEnabled,
    notification_channel: vehicle.notificationChannel,
    created_at: vehicle.createdAt,
    updated_at: vehicle.updatedAt
  };
}

export function isRemotePortalEnabled() {
  return isSupabaseEnabled();
}

export async function signInRemoteAdmin(email, password) {
  if (!isSupabaseEnabled()) {
    return { user: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

export async function signOutRemoteAdmin() {
  if (!isSupabaseEnabled()) return;
  await supabase.auth.signOut();
}

export async function getRemoteAuthUser() {
  if (!isSupabaseEnabled()) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user || null;
}

export async function isRemoteAdmin() {
  if (!isSupabaseEnabled()) return false;
  const { data, error } = await supabase.rpc('is_portal_admin');
  if (error) return false;
  return Boolean(data);
}

export async function getVehicles() {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from('vehicle_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapRemoteVehicle);
  }

  return getLocalVehicles().map(normalizeLocalVehicle);
}

export async function getVehicleById(id) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from('vehicle_jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapRemoteVehicle(data) : null;
  }

  return getLocalVehicles().find((item) => item.id === id) || null;
}

export async function registerVehicle(vehicle) {
  const clean = buildVehicleRecord(vehicle);

  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from('vehicle_jobs')
      .insert(mapRemotePayload(clean))
      .select('*')
      .single();

    if (error) throw error;
    return mapRemoteVehicle(data);
  }

  const list = getLocalVehicles();
  list.unshift(clean);
  saveLocalVehicles(list);
  return clean;
}

export async function updateVehicle(id, updates) {
  const nextUpdates = {
    ...updates,
    updatedAt: new Date().toISOString()
  };

  if (isSupabaseEnabled()) {
    const remoteUpdates = {};
    if (nextUpdates.status !== undefined) remoteUpdates.status = nextUpdates.status;
    if (nextUpdates.notes !== undefined) remoteUpdates.notes = nextUpdates.notes;
    if (nextUpdates.notificationsEnabled !== undefined) remoteUpdates.notifications_enabled = Boolean(nextUpdates.notificationsEnabled);
    if (nextUpdates.notificationChannel !== undefined) remoteUpdates.notification_channel = nextUpdates.notificationChannel;
    if (nextUpdates.lastNotifiedAt !== undefined) remoteUpdates.last_notified_at = nextUpdates.lastNotifiedAt;
    remoteUpdates.updated_at = nextUpdates.updatedAt;

    const { data, error } = await supabase
      .from('vehicle_jobs')
      .update(remoteUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return mapRemoteVehicle(data);
  }

  const list = getLocalVehicles();
  const next = list.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      ...nextUpdates
    };
  });
  saveLocalVehicles(next);
  return next.find((item) => item.id === id) || null;
}

export async function updateVehicleStatus(id, status) {
  return updateVehicle(id, { status, lastNotifiedAt: new Date().toISOString() });
}

export function setSession(session) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession() {
  if (typeof window === 'undefined') return null;
  return parseJson(localStorage.getItem(SESSION_KEY) || 'null', null);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export async function findCustomerVehicle(email, plate) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPlate = plate.trim().toUpperCase();

  if (isSupabaseEnabled()) {
    const { data, error } = await supabase.rpc('customer_lookup_vehicle', {
      p_email: cleanEmail,
      p_plate: cleanPlate
    });

    if (error) throw error;
    if (!data || !data.length) return null;
    return mapRemoteVehicle(data[0]);
  }

  return getLocalVehicles().find((item) => item.email === cleanEmail && item.plate === cleanPlate) || null;
}

export async function getCustomerVehicleStatus(email, plate) {
  return findCustomerVehicle(email, plate);
}

export async function registerVehiclePublic(data) {
  if (isSupabaseEnabled()) {
    const { data: result, error } = await supabase.rpc('register_vehicle_public', {
      p_customer_name:           data.customerName,
      p_email:                   data.email,
      p_phone:                   data.phone            || '',
      p_address:                 data.address          || '',
      p_city:                    data.city             || '',
      p_state:                   data.state            || '',
      p_zip:                     data.zip              || '',
      p_home_phone:              data.homePhone        || '',
      p_how_heard:               data.howHeard         || '',
      p_year:                    data.year,
      p_make:                    data.make,
      p_model:                   data.model,
      p_plate:                   data.plate,
      p_vin:                     data.vin              || '',
      p_color:                   data.color            || '',
      p_insurance_company:       data.insuranceCompany || '',
      p_deductible:              data.deductible       || '',
      p_claim_number:            data.claimNumber      || '',
      p_notes:                   data.notes            || '',
      p_direction_to_pay_signed: Boolean(data.directionToPaySigned),
      p_repair_auth_signed:      Boolean(data.repairAuthSigned),
      p_insurance_auth_name:     data.insuranceAuthName || '',
      p_signature_name:          data.signatureName    || '',
      p_signed_at:               data.signedAt         || new Date().toISOString()
    });
    if (error) throw error;
    return result;
  }

  // Local fallback
  const id = `AD-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();
  const list = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('alldentpdr_vehicles') || '[]')
    : [];
  list.unshift({ id, ...data, status: 'Registered', createdAt: now, updatedAt: now });
  if (typeof window !== 'undefined') {
    localStorage.setItem('alldentpdr_vehicles', JSON.stringify(list));
  }
  return id;
}

/* ============================================================
   Pricing Matrix (per-tier � panel � size) � local-only for now
   ============================================================ */
export function getPricing() {
  if (typeof window === 'undefined') return null;
  return parseJson(localStorage.getItem(PRICING_KEY) || 'null', null);
}

export function savePricing(pricing) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRICING_KEY, JSON.stringify(pricing));
}

/* ============================================================
   Leads (contact form submissions with ad attribution)
   ============================================================ */

function mapRemoteLead(item) {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone || '',
    location: item.location || '',
    vehicle: item.vehicle || '',
    message: item.message,
    status: item.status || 'New',
    utmSource: item.utm_source || '',
    utmMedium: item.utm_medium || '',
    utmCampaign: item.utm_campaign || '',
    utmContent: item.utm_content || '',
    utmTerm: item.utm_term || '',
    referrer: item.referrer || '',
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

export async function getLeads() {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRemoteLead);
  }
  // Fallback: no local storage for leads (they come from server)
  return [];
}

export async function updateLead(id, updates) {
  if (isSupabaseEnabled()) {
    const payload = { updated_at: new Date().toISOString() };
    if (updates.status) payload.status = updates.status;
    const { error } = await supabase.from('leads').update(payload).eq('id', id);
    if (error) throw error;
  }
}

