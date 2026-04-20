import { isSupabaseEnabled, supabase } from './supabaseClient';

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
    year: item.year,
    make: item.make,
    model: item.model,
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
    phone: vehicle.phone.trim(),
    year: vehicle.year.trim(),
    make: vehicle.make.trim(),
    model: vehicle.model.trim(),
    plate: vehicle.plate.trim().toUpperCase(),
    status: vehicle.status || 'Registered',
    notes: vehicle.notes.trim(),
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
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
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
  return updateVehicle(id, { status });
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
