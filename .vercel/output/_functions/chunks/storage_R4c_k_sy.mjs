import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ppkumkvhmlanuexlvszt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwa3Vta3ZobWxhbnVleGx2c3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTY0MDcsImV4cCI6MjA5MjI3MjQwN30.-GsynqOcJLWC_5fLICRQnX8OhTsH71YS-rEcusXA8g8";
const supabase = createClient(supabaseUrl, supabaseAnonKey) ;
function isSupabaseEnabled() {
  return Boolean(supabase);
}

const VEHICLES_KEY = 'alldentpdr_vehicles';
const SESSION_KEY = 'alldentpdr_portal_session';

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
    howHeardAboutUs: item.how_heard_about_us || '',
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

function isRemotePortalEnabled() {
  return isSupabaseEnabled();
}

async function signInRemoteAdmin(email, password) {
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

async function signOutRemoteAdmin() {
  if (!isSupabaseEnabled()) return;
  await supabase.auth.signOut();
}

async function getRemoteAuthUser() {
  if (!isSupabaseEnabled()) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user || null;
}

async function isRemoteAdmin() {
  if (!isSupabaseEnabled()) return false;
  const { data, error } = await supabase.rpc('is_portal_admin');
  if (error) return false;
  return Boolean(data);
}

async function getVehicles() {
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

async function registerVehicle(vehicle) {
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

async function updateVehicle(id, updates) {
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

async function updateVehicleStatus(id, status) {
  return updateVehicle(id, { status });
}

function setSession(session) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function getSession() {
  if (typeof window === 'undefined') return null;
  return parseJson(localStorage.getItem(SESSION_KEY) || 'null', null);
}

function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

async function findCustomerVehicle(email, plate) {
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

async function registerVehiclePublic(data) {
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
      p_signature_name:          data.signatureName    || ''
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

export { getRemoteAuthUser as a, isRemoteAdmin as b, clearSession as c, setSession as d, getVehicles as e, signInRemoteAdmin as f, getSession as g, updateVehicle as h, isRemotePortalEnabled as i, findCustomerVehicle as j, registerVehiclePublic as k, registerVehicle as r, signOutRemoteAdmin as s, updateVehicleStatus as u };
