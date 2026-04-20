import { useEffect, useState } from 'react';
import {
  clearSession,
  findCustomerVehicle,
  getSession,
  isRemotePortalEnabled,
  setSession
} from './portal/storage';

const STATUS_ORDER = ['Registered', 'In Progress', 'Complete'];

function statusIndex(status) {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : 0;
}

function statusPillClass(status) {
  if (status === 'Complete') return 'status-pill is-complete';
  if (status === 'In Progress') return 'status-pill is-progress';
  return 'status-pill';
}

export default function CustomerPortal() {
  const [email, setEmail] = useState('');
  const [plate, setPlate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setLocalSession] = useState(() => getSession());
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!session || session.role !== 'customer') {
        if (active) setVehicle(null);
        return;
      }
      setLoading(true);
      try {
        const next = await findCustomerVehicle(session.email || '', session.plate || '');
        if (active) setVehicle(next);
      } catch {
        if (active) setError('Unable to load vehicle status right now. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    if (session && session.role === 'customer' && isRemotePortalEnabled()) {
      const id = window.setInterval(load, 30000);
      return () => { active = false; window.clearInterval(id); };
    }
    return () => { active = false; };
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const match = await findCustomerVehicle(email, plate);
      if (!match) {
        setError('No vehicle found for that email and plate. Please double-check both fields.');
        return;
      }
      const next = {
        role: 'customer',
        vehicleId: match.id,
        email: match.email,
        plate: match.plate,
        loggedInAt: new Date().toISOString()
      };
      setSession(next);
      setLocalSession(next);
      setVehicle(match);
    } catch {
      setError('Unable to verify your vehicle right now. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setLocalSession(null);
    setVehicle(null);
    setEmail('');
    setPlate('');
  };

  if (!vehicle) {
    return (
      <section className="portal-shell">
        <div className="portal-wrap">
          <div className="portal-card portal-login-card">
            <span className="section-label">Customer Portal</span>
            <h2>Track your vehicle</h2>
            <p className="muted">Enter the email and license plate used at registration to see real-time progress on your repair.</p>

            <form onSubmit={handleLogin}>
              <label htmlFor="cp-email">Email</label>
              <input
                id="cp-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
              />

              <label htmlFor="cp-plate">License plate</label>
              <input
                id="cp-plate"
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="ABC1234"
                required
              />

              {error && <p className="portal-error">{error}</p>}

              <button className="button primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
                {loading ? 'Checking…' : 'View status'}
              </button>
            </form>

            <p className="portal-note">
              {isRemotePortalEnabled()
                ? 'Live portal · status refreshes automatically every 30 seconds.'
                : 'Demo mode active until the live portal database is connected.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const activeStep = statusIndex(vehicle.status);

  return (
    <section className="portal-shell">
      <div className="portal-wrap">
        <div className="portal-card">
          <div className="portal-head">
            <div>
              <span className="section-label">Vehicle Status</span>
              <h2>{vehicle.year} {vehicle.make} {vehicle.model}</h2>
              <p className="muted">Job ID <strong>{vehicle.id}</strong> · Plate <strong>{vehicle.plate}</strong></p>
            </div>
            <button className="button ghost sm" type="button" onClick={handleLogout}>Log out</button>
          </div>

          <div className="portal-grid">
            <div className="portal-status-box">
              <p className="portal-kicker">Current status</p>
              <span className={statusPillClass(vehicle.status)}>{vehicle.status}</span>
              <p>Updated {new Date(vehicle.updatedAt).toLocaleString()}</p>
            </div>
            <div className="portal-status-box">
              <p className="portal-kicker">On file</p>
              <p><strong>{vehicle.customerName}</strong></p>
              <p>{vehicle.email}</p>
            </div>
          </div>

          <div className="portal-timeline" aria-label="Repair progress">
            {STATUS_ORDER.map((label, i) => (
              <div key={label} className={`timeline-step ${i <= activeStep ? 'is-active' : ''}`}>
                <span className="timeline-dot" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {vehicle.notes && (
            <div className="portal-note-box">
              <p className="portal-kicker">Technician notes</p>
              <p>{vehicle.notes}</p>
            </div>
          )}

          <div className="portal-note-box">
            <p className="portal-kicker">Notifications</p>
            <p>
              {vehicle.notificationsEnabled
                ? `Status alerts are enabled via ${vehicle.notificationChannel}.`
                : 'Notifications are not enabled for this job yet.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
