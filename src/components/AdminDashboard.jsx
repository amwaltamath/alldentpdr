import { useEffect, useMemo, useState } from 'react';
import {
  clearSession,
  getRemoteAuthUser,
  getSession,
  getVehicles,
  isRemoteAdmin,
  isRemotePortalEnabled,
  registerVehicle,
  setSession,
  signInRemoteAdmin,
  signOutRemoteAdmin,
  updateVehicle,
  updateVehicleStatus
} from './portal/storage';

const ADMIN_USER = import.meta.env.PUBLIC_PORTAL_ADMIN_USER || 'admin';
const ADMIN_PASS = import.meta.env.PUBLIC_PORTAL_ADMIN_PASS || 'allDent2026';
const STATUS_OPTIONS = ['Registered', 'In Progress', 'Complete'];

const initialForm = {
  // Customer Information
  customerName: '',
  email: '',
  phone: '',
  homePhone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  howHeardAboutUs: '',
  // Insurance / Vehicle Information
  insuranceCompany: '',
  deductible: '',
  claimNumber: '',
  year: '',
  make: '',
  model: '',
  vin: '',
  color: '',
  plate: '',
  // Job Settings
  status: 'Registered',
  notes: '',
  notificationsEnabled: true,
  notificationChannel: 'email'
};

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '◧' },
  { id: 'pipeline', label: 'Pipeline', icon: '▦' },
  { id: 'jobs', label: 'All Jobs', icon: '☰' },
  { id: 'register', label: 'Register Vehicle', icon: '+' },
  { id: 'cards', label: 'Business Cards', icon: '▣' }
];

function statusBadge(status) {
  if (status === 'Complete') return 'badge complete';
  if (status === 'In Progress') return 'badge progress';
  return 'badge registered';
}

function initials(email = '') {
  if (!email) return 'A';
  const name = email.split('@')[0] || 'A';
  return name.slice(0, 2).toUpperCase();
}

export default function AdminDashboard() {
  const [session, setLocalSession] = useState(() => getSession());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [view, setView] = useState('overview');
  const [navOpen, setNavOpen] = useState(false);
  const [pipelineMode, setPipelineMode] = useState('kanban');
  const [form, setForm] = useState(initialForm);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  const remoteMode = isRemotePortalEnabled();

  // Bootstrap remote session
  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!remoteMode) return;
      const user = await getRemoteAuthUser();
      if (!active || !user) return;

      const allowed = await isRemoteAdmin();
      if (!allowed) {
        await signOutRemoteAdmin();
        if (active) {
          clearSession();
          setLocalSession(null);
          setAuthError('Your account is authenticated but not approved for admin access.');
        }
        return;
      }

      const next = { role: 'admin', email: user.email, loggedInAt: new Date().toISOString() };
      setSession(next);
      setLocalSession(next);
    }

    bootstrap();
    return () => { active = false; };
  }, [remoteMode]);

  // Load data once authenticated
  useEffect(() => {
    let active = true;

    async function load() {
      if (remoteMode && (!session || session.role !== 'admin')) {
        if (active) setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const next = await getVehicles();
        if (active) setVehicles(next);
      } catch {
        if (active) setAuthError('Unable to load vehicle data.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [remoteMode, session]);

  const filteredVehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      v.customerName.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.plate.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q) ||
      `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(q)
    );
  }, [search, vehicles]);

  const metrics = useMemo(() => {
    const total = vehicles.length;
    const registered = vehicles.filter((v) => v.status === 'Registered').length;
    const inProgress = vehicles.filter((v) => v.status === 'In Progress').length;
    const complete = vehicles.filter((v) => v.status === 'Complete').length;
    const completionRate = total ? Math.round((complete / total) * 100) : 0;
    return { total, registered, inProgress, complete, completionRate };
  }, [vehicles]);

  const grouped = useMemo(() => {
    const list = filteredVehicles;
    return {
      Registered: list.filter((v) => v.status === 'Registered'),
      'In Progress': list.filter((v) => v.status === 'In Progress'),
      Complete: list.filter((v) => v.status === 'Complete')
    };
  }, [filteredVehicles]);

  const recent = useMemo(() => filteredVehicles.slice(0, 5), [filteredVehicles]);

  // ---- handlers
  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    if (remoteMode) {
      try {
        const data = await signInRemoteAdmin(username, password);
        if (!data?.user) {
          setAuthError('Invalid admin credentials.');
          return;
        }
        const allowed = await isRemoteAdmin();
        if (!allowed) {
          await signOutRemoteAdmin();
          setAuthError('This account is not on the approved admin allowlist.');
          return;
        }
        const next = { role: 'admin', email: data.user.email, loggedInAt: new Date().toISOString() };
        setSession(next);
        setLocalSession(next);
        setUsername('');
        setPassword('');
      } catch {
        setAuthError('Login failed. Please verify your Supabase admin credentials.');
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      setAuthError('Invalid admin credentials.');
      setAuthLoading(false);
      return;
    }
    const next = { role: 'admin', loggedInAt: new Date().toISOString() };
    setSession(next);
    setLocalSession(next);
    setUsername('');
    setPassword('');
    setAuthLoading(false);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setSaveMessage('');
    try {
      await registerVehicle(form);
      setVehicles(await getVehicles());
      setForm(initialForm);
      setSaveMessage('Vehicle registered successfully.');
      setView('jobs');
    } catch {
      setSaveMessage('Unable to save the vehicle right now.');
    }
  };

  const handleStatusChange = async (id, nextStatus) => {
    await updateVehicleStatus(id, nextStatus);
    setVehicles(await getVehicles());
  };

  const handleNotificationChange = async (id, field, value) => {
    await updateVehicle(id, { [field]: value });
    setVehicles(await getVehicles());
  };

  const handleLogout = () => {
    if (remoteMode) signOutRemoteAdmin();
    clearSession();
    setLocalSession(null);
  };

  // ---- LOGIN screen
  if (!session || session.role !== 'admin') {
    return (
      <section className="portal-shell">
        <div className="portal-wrap">
          <div className="portal-card portal-login-card">
            <span className="section-label">Admin Sign-in</span>
            <h2>Welcome back</h2>
            <p className="muted">
              {remoteMode
                ? 'Sign in with your Supabase admin email.'
                : 'Demo mode — local credentials accepted until Supabase variables are set.'}
            </p>
            <form onSubmit={handleAdminLogin}>
              <label htmlFor="ad-user">{remoteMode ? 'Admin email' : 'Username'}</label>
              <input
                id="ad-user"
                type={remoteMode ? 'email' : 'text'}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={remoteMode ? 'admin@alldentpdr.com' : 'admin'}
                required
              />
              <label htmlFor="ad-pass">Password</label>
              <input
                id="ad-pass"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {authError && <p className="portal-error">{authError}</p>}
              <button className="button primary" type="submit" disabled={authLoading} style={{ width: '100%', marginTop: 4 }}>
                {authLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="portal-note">
              <a href="/">← Back to alldentpdr.com</a>
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ---- DASHBOARD shell
  const userInitials = initials(session.email);
  const userLabel = session.email || 'Admin';

  return (
    <div className="dash">
      {navOpen && <div className="dash-overlay" onClick={() => setNavOpen(false)} aria-hidden="true" />}
      <aside className={`dash-aside${navOpen ? ' is-open' : ''}`}>
        <a href="/" className="dash-brand" title="Back to site">
          <img src="/images/logo.jpg" alt="" />
          <div>
            <strong>AllDent</strong>
            <span>Admin</span>
          </div>
        </a>

        <div className="dash-nav-label">Workspace</div>
        <nav className="dash-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'is-active' : ''}
              onClick={() => { setView(item.id); setNavOpen(false); }}
            >
              <span aria-hidden="true" style={{ width: 16, opacity: .7 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="dash-nav-label">Account</div>
        <nav className="dash-nav">
          <a href="/" target="_blank" rel="noreferrer" onClick={() => setNavOpen(false)}>↗ View public site</a>
          <a href="/register" target="_blank" rel="noreferrer" onClick={() => setNavOpen(false)}>📋 Vehicle registration</a>
          <button type="button" onClick={() => { handleLogout(); setNavOpen(false); }}>↩ Sign out</button>
        </nav>

        <div className="dash-aside-bottom">
          <p>{remoteMode ? 'Live · Supabase connected' : 'Demo · local-only data'}</p>
          <div className="dash-aside-user">
            <span className="dash-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{userInitials}</span>
            <span className="dash-aside-user-label">{userLabel}</span>
          </div>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <button
            type="button"
            className="dash-hamburger"
            aria-label="Open navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          >
            <span /><span /><span />
          </button>
          <div>
            <p className="crumb">Admin</p>
            <h1>{NAV_ITEMS.find((n) => n.id === view)?.label || 'Dashboard'}</h1>
          </div>
          <div className="dash-search">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, plate, or job ID…"
            />
          </div>
          <div className="dash-user">
            <span className="dash-avatar">{userInitials}</span>
            <span>{userLabel}</span>
          </div>
        </header>

        <main className="dash-content">
          {view === 'overview' && (
            <OverviewView
              metrics={metrics}
              recent={recent}
              loading={loading}
              onJump={setView}
              remoteMode={remoteMode}
            />
          )}

          {view === 'pipeline' && (
            <PipelineView
              grouped={grouped}
              mode={pipelineMode}
              setMode={setPipelineMode}
              onStatusChange={handleStatusChange}
              loading={loading}
            />
          )}

          {view === 'jobs' && (
            <JobsView
              vehicles={filteredVehicles}
              loading={loading}
              onStatusChange={handleStatusChange}
              onNotificationChange={handleNotificationChange}
            />
          )}

          {view === 'register' && (
            <RegisterView
              form={form}
              setForm={setForm}
              onSubmit={handleRegister}
              saveMessage={saveMessage}
            />
          )}

          {view === 'cards' && <CardsView />}
        </main>
      </div>
    </div>
  );
}

/* ----------------- subviews ----------------- */

function OverviewView({ metrics, recent, loading, onJump, remoteMode }) {
  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><span className="kpi-label">Total jobs</span><span className="kpi-value">{metrics.total}</span><div className="kpi-sub">{remoteMode ? 'Live across all admins' : 'Local-only data'}</div></div>
        <div className="kpi kpi-accent"><span className="kpi-label">Registered</span><span className="kpi-value">{metrics.registered}</span><div className="kpi-sub">Awaiting work</div></div>
        <div className="kpi kpi-warn"><span className="kpi-label">In progress</span><span className="kpi-value">{metrics.inProgress}</span><div className="kpi-sub">Active right now</div></div>
        <div className="kpi kpi-ok"><span className="kpi-label">Completed</span><span className="kpi-value">{metrics.complete}</span><div className="kpi-sub">{metrics.completionRate}% completion rate</div></div>
      </div>

      <div className="dash-grid-2">
        <section className="panel">
          <div className="panel-head">
            <h3>Recent jobs</h3>
            <button type="button" className="button ghost sm" onClick={() => onJump('jobs')}>View all →</button>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((v) => (
                  <tr key={v.id}>
                    <td><div className="cell-strong">{v.id}</div><div className="cell-sub">{v.plate}</div></td>
                    <td><div className="cell-strong">{v.year} {v.make} {v.model}</div></td>
                    <td><div className="cell-strong">{v.customerName}</div><div className="cell-sub">{v.email}</div></td>
                    <td><span className={statusBadge(v.status)}>{v.status}</span></td>
                  </tr>
                ))}
                {!loading && !recent.length && (
                  <tr><td colSpan={4} className="kanban-empty">No jobs yet. Register your first vehicle to get started.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={4} className="kanban-empty">Loading…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function PipelineView({ grouped, mode, setMode, onStatusChange, loading }) {
  return (
    <>
      <div className="panel-head" style={{ marginBottom: 18, borderRadius: 12, background: 'transparent', borderBottom: 'none', padding: 0 }}>
        <div>
          <h3 style={{ marginBottom: 4 }}>Repair pipeline</h3>
          <p className="meta" style={{ margin: 0 }}>Move jobs through Registered → In Progress → Complete</p>
        </div>
        <div className="tabs">
          <button type="button" className={mode === 'kanban' ? 'is-active' : ''} onClick={() => setMode('kanban')}>Kanban</button>
          <button type="button" className={mode === 'list' ? 'is-active' : ''} onClick={() => setMode('list')}>List</button>
        </div>
      </div>

      {mode === 'kanban' ? (
        <div className="kanban">
          {STATUS_COLUMNS.map((col) => (
            <section key={col} className="kanban-col" data-col={col}>
              <div className="kanban-col-head">
                <strong>{col}</strong>
                <span className="count">{grouped[col].length}</span>
              </div>
              {grouped[col].length === 0 && <div className="kanban-empty">No jobs here.</div>}
              {grouped[col].map((v) => (
                <article key={v.id} className="kanban-card">
                  <div className="kc-id">{v.id}</div>
                  <div className="kc-title">{v.year} {v.make} {v.model}</div>
                  <div className="kc-meta">{v.customerName} · {v.plate}</div>
                  <div className="kc-foot">
                    <span className={statusBadge(v.status)}>{v.status}</span>
                    <select
                      value={v.status}
                      onChange={(e) => onStatusChange(v.id, e.target.value)}
                      aria-label={`Change status for ${v.id}`}
                    >
                      {STATUS_COLUMNS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </article>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <section className="panel">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {STATUS_COLUMNS.flatMap((col) => grouped[col]).map((v) => (
                  <tr key={v.id}>
                    <td><div className="cell-strong">{v.id}</div><div className="cell-sub">{v.plate}</div></td>
                    <td>{v.year} {v.make} {v.model}</td>
                    <td><div className="cell-strong">{v.customerName}</div><div className="cell-sub">{v.email}</div></td>
                    <td>
                      <select value={v.status} onChange={(e) => onStatusChange(v.id, e.target.value)}>
                        {STATUS_COLUMNS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {loading && <tr><td colSpan={4} className="kanban-empty">Loading…</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

const STATUS_COLUMNS = ['Registered', 'In Progress', 'Complete'];

function JobDetail({ v, onClose, onStatusChange, onNotificationChange }) {
  return (
    <div className="job-drawer-overlay" onClick={onClose}>
      <aside className="job-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="job-drawer-head">
          <div>
            <p className="crumb" style={{ margin: 0 }}>{v.id}</p>
            <h3 style={{ margin: '2px 0 0' }}>{v.year} {v.make} {v.model}</h3>
          </div>
          <button type="button" className="job-drawer-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="job-drawer-body">
          <h4 className="form-section-label">Status</h4>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={statusBadge(v.status)}>{v.status}</span>
            <select value={v.status} onChange={(e) => onStatusChange(v.id, e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <h4 className="form-section-label" style={{ marginTop: 22 }}>Customer</h4>
          <div className="job-drawer-grid">
            <div><span className="jd-label">Name</span><span className="jd-val">{v.customerName || '—'}</span></div>
            <div><span className="jd-label">Email</span><span className="jd-val">{v.email || '—'}</span></div>
            <div><span className="jd-label">Cell phone</span><span className="jd-val">{v.phone || '—'}</span></div>
            <div><span className="jd-label">Home phone</span><span className="jd-val">{v.homePhone || '—'}</span></div>
            <div><span className="jd-label">Address</span><span className="jd-val">{[v.address, v.city, v.state, v.zip].filter(Boolean).join(', ') || '—'}</span></div>
            <div><span className="jd-label">How heard</span><span className="jd-val">{v.howHeardAboutUs || '—'}</span></div>
          </div>

          <h4 className="form-section-label" style={{ marginTop: 22 }}>Vehicle</h4>
          <div className="job-drawer-grid">
            <div><span className="jd-label">Year / Make / Model</span><span className="jd-val">{v.year} {v.make} {v.model}</span></div>
            <div><span className="jd-label">Color</span><span className="jd-val">{v.color || '—'}</span></div>
            <div><span className="jd-label">Plate</span><span className="jd-val">{v.plate || '—'}</span></div>
            <div><span className="jd-label">VIN</span><span className="jd-val" style={{ fontFamily: 'monospace', fontSize: 13 }}>{v.vin || '—'}</span></div>
          </div>

          <h4 className="form-section-label" style={{ marginTop: 22 }}>Insurance</h4>
          <div className="job-drawer-grid">
            <div><span className="jd-label">Company</span><span className="jd-val">{v.insuranceCompany || '—'}</span></div>
            <div><span className="jd-label">Deductible</span><span className="jd-val">{v.deductible || '—'}</span></div>
            <div><span className="jd-label">Claim #</span><span className="jd-val">{v.claimNumber || '—'}</span></div>
          </div>

          {v.notes && (
            <>
              <h4 className="form-section-label" style={{ marginTop: 22 }}>Notes</h4>
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{v.notes}</p>
            </>
          )}

          <h4 className="form-section-label" style={{ marginTop: 22 }}>Notifications</h4>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="checkbox-row" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={Boolean(v.notificationsEnabled)}
                onChange={(e) => onNotificationChange(v.id, 'notificationsEnabled', e.target.checked)}
              />
              <span style={{ fontSize: 13 }}>Alerts enabled</span>
            </label>
            <select
              value={v.notificationChannel || 'email'}
              onChange={(e) => onNotificationChange(v.id, 'notificationChannel', e.target.value)}
            >
              <option value="email">Email</option>
              <option value="web-push">Web Push</option>
            </select>
          </div>

          <p className="cell-sub" style={{ marginTop: 20 }}>
            Registered {new Date(v.createdAt).toLocaleDateString()} · Updated {new Date(v.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </aside>
    </div>
  );
}

function JobsView({ vehicles, loading, onStatusChange, onNotificationChange }) {
  const [selected, setSelected] = useState(null);

  return (
    <>
      {selected && (
        <JobDetail
          v={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(id, s) => { onStatusChange(id, s); setSelected((prev) => prev ? { ...prev, status: s } : null); }}
          onNotificationChange={(id, field, val) => { onNotificationChange(id, field, val); setSelected((prev) => prev ? { ...prev, [field]: val } : null); }}
        />
      )}
      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>All jobs</h3>
            <p className="meta" style={{ margin: '2px 0 0' }}>{vehicles.length} {vehicles.length === 1 ? 'job' : 'jobs'}</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Vehicle</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Notifications</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="job-row-clickable" onClick={() => setSelected(v)}>
                  <td>
                    <div className="cell-strong">{v.id}</div>
                    <div className="cell-sub">{v.plate}</div>
                  </td>
                  <td>
                    <div className="cell-strong">{v.year} {v.make} {v.model}</div>
                    <div className="cell-sub">Updated {new Date(v.updatedAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div className="cell-strong">{v.customerName}</div>
                    <div className="cell-sub">{v.email}</div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select value={v.status} onChange={(e) => onStatusChange(v.id, e.target.value)}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="row-actions">
                      <label className="checkbox-row" style={{ margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(v.notificationsEnabled)}
                          onChange={(e) => onNotificationChange(v.id, 'notificationsEnabled', e.target.checked)}
                        />
                        <span style={{ fontSize: 13 }}>Alerts</span>
                      </label>
                      <select
                        value={v.notificationChannel || 'email'}
                        onChange={(e) => onNotificationChange(v.id, 'notificationChannel', e.target.value)}
                      >
                        <option value="email">Email</option>
                        <option value="web-push">Web Push</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !vehicles.length && (
                <tr><td colSpan={5} className="kanban-empty">No jobs match your search yet.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={5} className="kanban-empty">Loading…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

const TEAM_CARDS = [
  { slug: 'zachary', name: 'Zachary', title: 'PDR Specialist', email: 'zachary@alldentpdr.com' },
  { slug: 'kevin',   name: 'Kevin',   title: 'PDR Specialist', email: 'kevin@alldentpdr.com' },
  { slug: 'patrick', name: 'Patrick', title: 'PDR Specialist', email: 'patrick@alldentpdr.com' },
];

function CardsView() {
  const base = 'https://alldentpdr.com';
  return (
    <div>
      <div className="panel-head" style={{ marginBottom: 18, background: 'transparent', border: 'none', padding: 0 }}>
        <div>
          <h3 style={{ marginBottom: 4 }}>Digital Business Cards</h3>
          <p className="meta" style={{ margin: 0 }}>Share your card link or let customers scan the QR code.</p>
        </div>
      </div>
      <div className="cards-grid">
        {TEAM_CARDS.map((c) => {
          const url = `${base}/card/${c.slug}`;
          const qr = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}&color=b0522b&bgcolor=ffffff&margin=8`;
          return (
            <div key={c.slug} className="biz-preview-card">
              <div className="bpc-header">
                <img src="/images/logo.jpg" alt="" />
                <div>
                  <strong>{c.name}</strong>
                  <span>{c.title}</span>
                </div>
              </div>
              <img src={qr} alt={`QR for ${c.name}`} className="bpc-qr" width="80" height="80" />
              <p className="bpc-url">{url.replace('https://', '')}</p>
              <div className="bpc-actions">
                <a href={url} target="_blank" rel="noreferrer" className="button ghost sm">Preview ↗</a>
                <button
                  type="button"
                  className="button primary sm"
                  onClick={() => navigator.clipboard.writeText(url)}
                >
                  Copy link
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegisterView({ form, setForm, onSubmit, saveMessage }) {
  const onField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <section className="panel" style={{ maxWidth: 800 }}>
      <div className="panel-head">
        <div>
          <h3>Register a vehicle</h3>
          <p className="meta" style={{ margin: '2px 0 0' }}>Creates a customer-visible job in the portal.</p>
        </div>
      </div>
      <div className="panel-body">
        <form onSubmit={onSubmit}>

          {/* ── Customer Information ── */}
          <h4 className="form-section-label">Customer Information</h4>

          <label>Customer name</label>
          <input type="text" value={form.customerName} onChange={onField('customerName')} required />

          <div className="form-grid-2">
            <div>
              <label>Cell phone</label>
              <input type="tel" value={form.phone} onChange={onField('phone')} />
            </div>
            <div>
              <label>Home phone</label>
              <input type="tel" value={form.homePhone} onChange={onField('homePhone')} />
            </div>
          </div>

          <div className="form-grid-2">
            <div>
              <label>Customer email</label>
              <input type="email" value={form.email} onChange={onField('email')} required />
            </div>
            <div>
              <label>How did you hear about us?</label>
              <input type="text" value={form.howHeardAboutUs} onChange={onField('howHeardAboutUs')} />
            </div>
          </div>

          <label>Address</label>
          <input type="text" value={form.address} onChange={onField('address')} />

          <div className="form-grid-3">
            <div>
              <label>City</label>
              <input type="text" value={form.city} onChange={onField('city')} />
            </div>
            <div>
              <label>State</label>
              <input type="text" value={form.state} onChange={onField('state')} maxLength={2} style={{ textTransform: 'uppercase' }} />
            </div>
            <div>
              <label>ZIP</label>
              <input type="text" value={form.zip} onChange={onField('zip')} maxLength={10} />
            </div>
          </div>

          {/* ── Insurance / Vehicle Information ── */}
          <h4 className="form-section-label" style={{ marginTop: 28 }}>Insurance / Vehicle Information</h4>

          <div className="form-grid-3">
            <div>
              <label>Insurance company</label>
              <input type="text" value={form.insuranceCompany} onChange={onField('insuranceCompany')} />
            </div>
            <div>
              <label>Deductible</label>
              <input type="text" value={form.deductible} onChange={onField('deductible')} placeholder="$" />
            </div>
            <div>
              <label>Claim #</label>
              <input type="text" value={form.claimNumber} onChange={onField('claimNumber')} />
            </div>
          </div>

          <div className="form-grid-3">
            <div>
              <label>Year</label>
              <input type="text" value={form.year} onChange={onField('year')} required />
            </div>
            <div>
              <label>Make</label>
              <input type="text" value={form.make} onChange={onField('make')} required />
            </div>
            <div>
              <label>Model</label>
              <input type="text" value={form.model} onChange={onField('model')} required />
            </div>
          </div>

          <div className="form-grid-3">
            <div>
              <label>VIN #</label>
              <input type="text" value={form.vin} onChange={onField('vin')} maxLength={17} style={{ textTransform: 'uppercase' }} />
            </div>
            <div>
              <label>Color</label>
              <input type="text" value={form.color} onChange={onField('color')} />
            </div>
            <div>
              <label>License plate</label>
              <input type="text" value={form.plate} onChange={onField('plate')} required style={{ textTransform: 'uppercase' }} />
            </div>
          </div>

          {/* ── Job Settings ── */}
          <h4 className="form-section-label" style={{ marginTop: 28 }}>Job Settings</h4>

          <div className="form-grid-2">
            <div>
              <label>Initial status</label>
              <select value={form.status} onChange={onField('status')}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Notification channel</label>
              <select value={form.notificationChannel} onChange={onField('notificationChannel')}>
                <option value="email">Email</option>
                <option value="web-push">Web Push (future)</option>
              </select>
            </div>
          </div>

          <label>Repair notes (visible to customer)</label>
          <textarea rows="3" value={form.notes} onChange={onField('notes')} placeholder="Brief notes about the repair plan…" />

          <div className="checkbox-row">
            <input
              id="reg-notify"
              type="checkbox"
              checked={form.notificationsEnabled}
              onChange={(e) => setForm({ ...form, notificationsEnabled: e.target.checked })}
            />
            <label htmlFor="reg-notify">Enable status notifications for this customer</label>
          </div>

          {saveMessage && <p className="portal-note" style={{ marginBottom: 12 }}>{saveMessage}</p>}

          <button className="button primary" type="submit">Create job</button>
        </form>
      </div>
    </section>
  );
}
