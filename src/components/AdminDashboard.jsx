import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearSession,
  deleteVehicle,
  getChatConversations,
  getChatMessages,
  getLeads,
  getPricing,
  getRemoteAuthUser,
  getSession,
  getVehicles,
  isRemoteAdmin,
  isRemotePortalEnabled,
  markChatRead,
  registerVehicle,
  saveReleaseForm,
  savePricing,
  sendChatReply,
  setSession,
  signInRemoteAdmin,
  signOutRemoteAdmin,
  subscribeChatChanges,
  updateLeadStatus,
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
  { id: 'overview', label: 'Overview',          icon: '◧' },
  { id: 'pipeline', label: 'Pipeline',          icon: '▦' },
  { id: 'jobs',     label: 'All Jobs',          icon: '☰' },
  { id: 'leads',    label: 'Leads',             icon: '◎' },
  { id: 'messages', label: 'Messages',          icon: '💬' },
  { id: 'analytics',label: 'Analytics',          icon: '📈' },
  { id: 'quote',    label: 'New Quote',         icon: '$' },
  { id: 'pricing',  label: 'Pricing Matrix',    icon: '☰£' },
  { id: 'register', label: 'Register Vehicle',  icon: '+' },
  { id: 'cards',    label: 'Business Cards',    icon: '▣' },
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
  // Hydration-safe: start with null on both server and first client render,
  // then load any saved session after mount.
  const [session, setLocalSession] = useState(null);
  const [hydrated, setHydrated] = useState(false);
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
  const [releaseJob, setReleaseJob] = useState(null);
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const remoteMode = isRemotePortalEnabled();

  // Hydrate session from localStorage after mount (avoids SSR/CSR mismatch)
  useEffect(() => {
    setLocalSession(getSession());
    setHydrated(true);
  }, []);

  // Honor ?view= query param on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const v = new URLSearchParams(window.location.search).get('view');
    if (v && NAV_ITEMS.some((n) => n.id === v)) setView(v);
  }, []);

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
      setLeadsLoading(true);
      try {
        const [next, leadsNext, convNext] = await Promise.all([
          getVehicles(),
          getLeads(),
          getChatConversations().catch(() => []),
        ]);
        if (active) { setVehicles(next); setLeads(leadsNext); setConversations(convNext); }
      } catch {
        if (active) setAuthError('Unable to load vehicle data.');
      } finally {
        if (active) { setLoading(false); setLeadsLoading(false); }
      }
    }

    load();
    return () => { active = false; };
  }, [remoteMode, session]);

  // Realtime chat updates for admin
  useEffect(() => {
    if (remoteMode && (!session || session.role !== 'admin')) return;
    const unsub = subscribeChatChanges(async () => {
      try {
        const list = await getChatConversations();
        setConversations(list);
        if (activeConvId) {
          const msgs = await getChatMessages(activeConvId);
          setChatMessages(msgs);
        }
      } catch { /* ignore */ }
    });
    return unsub;
  }, [remoteMode, session, activeConvId]);

  // Load messages when opening a conversation
  useEffect(() => {
    if (!activeConvId) { setChatMessages([]); return; }
    let active = true;
    (async () => {
      setChatLoading(true);
      try {
        const msgs = await getChatMessages(activeConvId);
        if (active) setChatMessages(msgs);
        await markChatRead(activeConvId);
        if (active) {
          setConversations((prev) => prev.map((c) =>
            c.id === activeConvId ? { ...c, unread_admin: 0 } : c
          ));
        }
      } finally {
        if (active) setChatLoading(false);
      }
    })();
    return () => { active = false; };
  }, [activeConvId]);

  const handleChatReply = async (body) => {
    if (!activeConvId || !body.trim()) return;
    const senderName = session?.email?.split('@')[0] || 'All Dent PDR';
    await sendChatReply(activeConvId, body.trim(), senderName);
    const msgs = await getChatMessages(activeConvId);
    setChatMessages(msgs);
    const list = await getChatConversations();
    setConversations(list);
  };

  const totalUnreadChat = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unread_admin || 0), 0),
    [conversations]
  );

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
    const updated = await getVehicles();
    setVehicles(updated);

    // Send customer email if notifications are enabled
    const vehicle = updated.find((v) => v.id === id);
    if (vehicle?.notificationsEnabled && vehicle?.email) {
      fetch('/api/send-status-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: vehicle.id,
          customerName: vehicle.customerName,
          email: vehicle.email,
          status: nextStatus,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          plate: vehicle.plate,
        }),
      }).catch((err) => console.warn('[status email]', err));
    }
  };

  const handleNotificationChange = async (id, field, value) => {
    await updateVehicle(id, { [field]: value });
    setVehicles(await getVehicles());
  };

  const handleReleaseSaved = (updatedJob) => {
    setVehicles((prev) => prev.map((v) => v.id === updatedJob.id ? { ...v, releaseFormData: updatedJob.releaseFormData } : v));
    setReleaseJob(null);
  };

  const handleLeadStatusChange = async (id, status) => {
    await updateLeadStatus(id, status);
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this job? This cannot be undone.')) return;
    try {
      await deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
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
      {releaseJob && (
        <VehicleReleaseModal
          job={releaseJob}
          onClose={() => setReleaseJob(null)}
          onSaved={handleReleaseSaved}
        />
      )}
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
              {item.id === 'messages' && totalUnreadChat > 0 && (
                <span className="nav-badge">{totalUnreadChat}</span>
              )}
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
              onRelease={setReleaseJob}
              onDelete={handleDelete}
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

          {view === 'quote' && (
            <QuoteView vehicles={vehicles} />
          )}

          {view === 'pricing' && (
            <PricingView />
          )}

          {view === 'leads' && (
            <LeadsView
              leads={leads}
              loading={leadsLoading}
              onStatusChange={handleLeadStatusChange}
            />
          )}

          {view === 'messages' && (
            <MessagesView
              conversations={conversations}
              activeId={activeConvId}
              onSelect={setActiveConvId}
              messages={chatMessages}
              loading={chatLoading}
              onReply={handleChatReply}
            />
          )}

          {view === 'analytics' && <AnalyticsView />}

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

function JobDetail({ v, onClose, onStatusChange, onNotificationChange, onRelease, onDelete }) {
  return (
    <div className="job-inline-detail">
      <div className="jid-header">
        <div>
          <p className="crumb" style={{ margin: 0 }}>{v.id} &nbsp;·&nbsp; {v.plate}</p>
          <h3 style={{ margin: '2px 0 0' }}>{v.year} {v.make} {v.model}</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" className="button ghost sm jid-delete" onClick={() => onDelete(v.id)} title="Delete this job">🗑 Delete job</button>
          <button type="button" className="job-drawer-close" onClick={onClose} aria-label="Collapse detail">✕ Close</button>
        </div>
      </div>

      <div className="jid-body">
        {/* Left column */}
        <div className="jid-col">
          <h4 className="form-section-label">Status</h4>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={statusBadge(v.status)}>{v.status}</span>
            <select value={v.status} onChange={(e) => onStatusChange(v.id, e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <h4 className="form-section-label" style={{ marginTop: 18 }}>Vehicle Release</h4>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {v.releaseFormData && (
              <span style={{ fontSize: 12, color: 'var(--sage,#4a7a5c)', fontWeight: 600 }}>✓ Signed {v.releaseFormData.signedAt || ''}</span>
            )}
            <button type="button" className="button primary sm" onClick={() => onRelease(v)}>
              {v.releaseFormData ? '📋 View / Re-sign Release' : '📋 Issue Vehicle Release'}
            </button>
          </div>

          <h4 className="form-section-label" style={{ marginTop: 18 }}>Customer</h4>
          <div className="job-drawer-grid">
            <div><span className="jd-label">Name</span><span className="jd-val">{v.customerName || '—'}</span></div>
            <div><span className="jd-label">Email</span><span className="jd-val">{v.email || '—'}</span></div>
            <div><span className="jd-label">Cell phone</span><span className="jd-val">{v.phone || '—'}</span></div>
            <div><span className="jd-label">Home phone</span><span className="jd-val">{v.homePhone || '—'}</span></div>
            <div><span className="jd-label">Address</span><span className="jd-val">{[v.address, v.city, v.state, v.zip].filter(Boolean).join(', ') || '—'}</span></div>
            <div><span className="jd-label">How heard</span><span className="jd-val">{v.howHeardAboutUs || '—'}</span></div>
          </div>
        </div>

        {/* Right column */}
        <div className="jid-col">
          <h4 className="form-section-label">Vehicle</h4>
          <div className="job-drawer-grid">
            <div><span className="jd-label">Year / Make / Model</span><span className="jd-val">{v.year} {v.make} {v.model}</span></div>
            <div><span className="jd-label">Color</span><span className="jd-val">{v.color || '—'}</span></div>
            <div><span className="jd-label">Plate</span><span className="jd-val">{v.plate || '—'}</span></div>
            <div><span className="jd-label">VIN</span><span className="jd-val" style={{ fontFamily: 'monospace', fontSize: 13 }}>{v.vin || '—'}</span></div>
          </div>

          <h4 className="form-section-label" style={{ marginTop: 18 }}>Insurance</h4>
          <div className="job-drawer-grid">
            <div><span className="jd-label">Company</span><span className="jd-val">{v.insuranceCompany || '—'}</span></div>
            <div><span className="jd-label">Deductible</span><span className="jd-val">{v.deductible || '—'}</span></div>
            <div><span className="jd-label">Claim #</span><span className="jd-val">{v.claimNumber || '—'}</span></div>
          </div>

          {v.notes && (
            <>
              <h4 className="form-section-label" style={{ marginTop: 18 }}>Notes</h4>
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{v.notes}</p>
            </>
          )}

          <h4 className="form-section-label" style={{ marginTop: 18 }}>Notifications</h4>
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

          <p className="cell-sub" style={{ marginTop: 16 }}>
            Registered {new Date(v.createdAt).toLocaleDateString()} · Updated {new Date(v.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function JobsView({ vehicles, loading, onStatusChange, onNotificationChange, onRelease, onDelete }) {
  const [selectedId, setSelectedId] = useState(null);
  const [queue, setQueue] = useState('open');

  const toggle = (id) => setSelectedId((cur) => cur === id ? null : id);

  const openJobs   = vehicles.filter((v) => v.status !== 'Complete');
  const closedJobs = vehicles.filter((v) => v.status === 'Complete');
  const shown      = queue === 'open' ? openJobs : closedJobs;

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>All jobs</h3>
          <p className="meta" style={{ margin: '2px 0 0' }}>{shown.length} {shown.length === 1 ? 'job' : 'jobs'} &mdash; click a row to expand details</p>
        </div>
        <div className="queue-tabs">
          <button
            type="button"
            className={`queue-tab${queue === 'open' ? ' active' : ''}`}
            onClick={() => { setQueue('open'); setSelectedId(null); }}
          >Open <span className="queue-count">{openJobs.length}</span></button>
          <button
            type="button"
            className={`queue-tab${queue === 'closed' ? ' active' : ''}`}
            onClick={() => { setQueue('closed'); setSelectedId(null); }}
          >Closed <span className="queue-count">{closedJobs.length}</span></button>
        </div>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 28 }}></th>
              <th>Job</th>
              <th>Vehicle</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Notifications</th>
              <th>Release</th>
              <th style={{ width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((v) => {
              const isOpen = selectedId === v.id;
              return (
                <Fragment key={v.id}>
                  <tr
                    className={`job-row-clickable${isOpen ? ' is-expanded' : ''}`}
                    onClick={() => toggle(v.id)}
                  >
                    <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 10, paddingRight: 0 }}>
                      {isOpen ? '▼' : '▶'}
                    </td>
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`button sm ${v.releaseFormData ? 'ghost' : 'primary'}`}
                        onClick={() => onRelease(v)}
                        title={v.releaseFormData ? 'View signed release' : 'Issue vehicle release form'}
                      >
                        {v.releaseFormData ? '✓ Release' : '📋 Release'}
                      </button>
                    </td>
                    <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-delete-job"
                        onClick={() => onDelete(v.id)}
                        title="Delete job"
                        aria-label="Delete job"
                      >🗑</button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="job-detail-tr">
                      <td colSpan={8} className="job-detail-td">
                        <JobDetail
                          v={v}
                          onClose={() => setSelectedId(null)}
                          onStatusChange={onStatusChange}
                          onNotificationChange={onNotificationChange}
                          onRelease={(job) => { setSelectedId(null); onRelease(job); }}
                          onDelete={(id) => { setSelectedId(null); onDelete(id); }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!loading && !shown.length && (
              <tr><td colSpan={8} className="kanban-empty">{queue === 'open' ? 'No open jobs.' : 'No closed jobs yet.'}</td></tr>
            )}
            {loading && (
              <tr><td colSpan={8} className="kanban-empty">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const LEAD_STATUSES = ['New', 'Contacted', 'Quoted', 'Converted', 'Closed'];

function sourceLabel(src) {
  if (!src) return 'Organic';
  const s = src.toLowerCase();
  if (s.includes('google')) return 'Google';
  if (s.includes('facebook') || s.includes('meta') || s.includes('fb') || s.includes('instagram') || s.includes('ig')) return 'Meta';
  return src.charAt(0).toUpperCase() + src.slice(1);
}

function sourceBadgeClass(src) {
  const lbl = sourceLabel(src);
  if (lbl === 'Google') return 'source-badge google';
  if (lbl === 'Meta') return 'source-badge meta';
  if (!src) return 'source-badge organic';
  return 'source-badge other';
}

function LeadsView({ leads, loading, onStatusChange }) {
  const [filter, setFilter] = useState('all');

  const total = leads.length;
  const byStatus = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0]));
  leads.forEach((l) => { if (byStatus[l.status] !== undefined) byStatus[l.status]++; });

  const googleCount = leads.filter((l) => sourceLabel(l.utm_source) === 'Google').length;
  const metaCount   = leads.filter((l) => sourceLabel(l.utm_source) === 'Meta').length;
  const organicCount = leads.filter((l) => !l.utm_source).length;
  const otherCount  = total - googleCount - metaCount - organicCount;

  const shown = filter === 'all' ? leads : leads.filter((l) => l.status === filter);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>Leads &amp; Analytics</h3>
          <p className="meta" style={{ margin: '2px 0 0' }}>{total} total leads from contact form · click a status to filter</p>
        </div>
      </div>

      {/* Source + status KPIs */}
      <div className="leads-kpi-row">
        <div className="leads-kpi"><span className="leads-kpi-val">{total}</span><span className="leads-kpi-lbl">Total Leads</span></div>
        <div className="leads-kpi accent-rust"><span className="leads-kpi-val">{byStatus['New']}</span><span className="leads-kpi-lbl">New</span></div>
        <div className="leads-kpi accent-sage"><span className="leads-kpi-val">{byStatus['Converted']}</span><span className="leads-kpi-lbl">Converted</span></div>
        <div className="leads-kpi accent-google"><span className="leads-kpi-val">{googleCount}</span><span className="leads-kpi-lbl">Google Ads</span></div>
        <div className="leads-kpi accent-meta"><span className="leads-kpi-val">{metaCount}</span><span className="leads-kpi-lbl">Meta / FB</span></div>
        <div className="leads-kpi accent-muted"><span className="leads-kpi-val">{organicCount}</span><span className="leads-kpi-lbl">Organic / Direct</span></div>
        {otherCount > 0 && <div className="leads-kpi"><span className="leads-kpi-val">{otherCount}</span><span className="leads-kpi-lbl">Other</span></div>}
      </div>

      {/* Status filter tabs */}
      <div className="queue-tabs" style={{ padding: '16px 0', borderBottom: '1px solid var(--line)', marginBottom: 16 }}>
        <button type="button" className={`queue-tab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          All <span className="queue-count">{total}</span>
        </button>
        {LEAD_STATUSES.map((s) => (
          <button key={s} type="button" className={`queue-tab${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
            {s} <span className="queue-count">{byStatus[s]}</span>
          </button>
        ))}
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Vehicle / Note</th>
              <th>Source</th>
              <th>Campaign / Keyword</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((l) => (
              <tr key={l.id}>
                <td>
                  <div className="cell-strong">{new Date(l.created_at).toLocaleDateString()}</div>
                  <div className="cell-sub">{l.id}</div>
                </td>
                <td>
                  <div className="cell-strong">{l.name}</div>
                  <div className="cell-sub">{l.location || '—'}</div>
                </td>
                <td>
                  <div className="cell-strong">{l.email}</div>
                  <div className="cell-sub">{l.phone || '—'}</div>
                </td>
                <td>
                  <div className="cell-strong">{l.vehicle || '—'}</div>
                  <div className="cell-sub" title={l.message}>{l.message?.slice(0, 55)}{l.message?.length > 55 ? '…' : ''}</div>
                </td>
                <td>
                  <span className={sourceBadgeClass(l.utm_source)}>{sourceLabel(l.utm_source)}</span>
                  {l.utm_medium && <div className="cell-sub">{l.utm_medium}</div>}
                  {l.referrer && !l.utm_source && <div className="cell-sub" title={l.referrer} style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.referrer.replace(/^https?:\/\//, '')}</div>}
                </td>
                <td>
                  <div className="cell-strong">{l.utm_campaign || '—'}</div>
                  {l.utm_term && <div className="cell-sub">🔑 {l.utm_term}</div>}
                  {l.utm_content && <div className="cell-sub">{l.utm_content}</div>}
                </td>
                <td>
                  <select value={l.status} onChange={(e) => onStatusChange(l.id, e.target.value)}>
                    {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!loading && !shown.length && (
              <tr><td colSpan={7} className="kanban-empty">{filter === 'all' ? 'No leads yet — contact form submissions will appear here.' : `No leads with status "${filter}".`}</td></tr>
            )}
            {loading && (
              <tr><td colSpan={7} className="kanban-empty">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AnalyticsView() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/analytics');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load analytics');
        if (active) setData(json);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) return <section className="panel"><div className="kanban-empty">Loading analytics…</div></section>;
  if (error === 'not_configured') return (
    <section className="panel">
      <div className="panel-head"><h3>Analytics</h3></div>
      <div className="analytics-setup-notice">
        <p><strong>GA4 not configured yet.</strong> To connect Google Analytics:</p>
        <ol>
          <li>In <a href="https://console.cloud.google.com" target="_blank" rel="noopener">Google Cloud Console</a> — enable the <strong>Google Analytics Data API</strong> and create a <strong>Service Account</strong>. Download its JSON key.</li>
          <li>In <a href="https://analytics.google.com" target="_blank" rel="noopener">GA4 Admin</a> → Property Access Management — add the service account email as <strong>Viewer</strong>.</li>
          <li>In <a href="https://vercel.com" target="_blank" rel="noopener">Vercel</a> → Project Settings → Environment Variables — add:<br /><code>GA4_SERVICE_ACCOUNT_KEY</code> = (paste the entire JSON key as one line)<br /><code>GA4_PROPERTY_ID</code> = (your numeric GA4 property ID, e.g. <code>123456789</code>)</li>
          <li>Redeploy — analytics will appear here automatically.</li>
        </ol>
      </div>
    </section>
  );
  if (error) return <section className="panel"><div className="kanban-empty" style={{color:'#c0392b'}}>Error: {error}</div></section>;

  // Parse summary KPIs
  const kpiRow  = data?.summary?.rows?.[0]?.metricValues || [];
  const sessions   = parseInt(kpiRow[0]?.value || 0).toLocaleString();
  const users      = parseInt(kpiRow[1]?.value || 0).toLocaleString();
  const pageviews  = parseInt(kpiRow[2]?.value || 0).toLocaleString();
  const bounceRaw  = parseFloat(kpiRow[3]?.value || 0);
  const bounce     = (bounceRaw * 100).toFixed(1) + '%';
  const durRaw     = parseFloat(kpiRow[4]?.value || 0);
  const dur        = durRaw >= 60 ? `${Math.floor(durRaw/60)}m ${Math.round(durRaw%60)}s` : `${Math.round(durRaw)}s`;

  // Traffic sources
  const sourceRows = data?.sources?.rows || [];

  // Top pages
  const pageRows = data?.pages?.rows || [];

  // Daily sparkline (simple bar chart via CSS)
  const dailyRows = data?.daily?.rows || [];
  const maxSessions = Math.max(...dailyRows.map(r => parseInt(r.metricValues[0].value)), 1);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>Analytics</h3>
          <p className="meta" style={{ margin: '2px 0 0' }}>Last 30 days · Google Analytics 4</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="leads-kpi-row">
        <div className="leads-kpi accent-google"><span className="leads-kpi-val">{sessions}</span><span className="leads-kpi-lbl">Sessions</span></div>
        <div className="leads-kpi accent-sage"><span className="leads-kpi-val">{users}</span><span className="leads-kpi-lbl">Users</span></div>
        <div className="leads-kpi"><span className="leads-kpi-val">{pageviews}</span><span className="leads-kpi-lbl">Page Views</span></div>
        <div className="leads-kpi accent-muted"><span className="leads-kpi-val">{bounce}</span><span className="leads-kpi-lbl">Bounce Rate</span></div>
        <div className="leads-kpi"><span className="leads-kpi-val">{dur}</span><span className="leads-kpi-lbl">Avg Session</span></div>
      </div>

      {/* Daily sparkline */}
      {dailyRows.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p className="cell-sub" style={{ marginBottom: 8 }}>Daily sessions (last 30 days)</p>
          <div className="analytics-sparkline">
            {dailyRows.map((r) => {
              const val = parseInt(r.metricValues[0].value);
              const h   = Math.max(4, Math.round((val / maxSessions) * 48));
              const d   = r.dimensionValues[0].value;
              const label = `${d.slice(4,6)}/${d.slice(6,8)}: ${val} sessions`;
              return (
                <div key={d} className="spark-bar-wrap" title={label}>
                  <div className="spark-bar" style={{ height: h + 'px' }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="analytics-two-col">
        {/* Traffic sources */}
        <div>
          <h4 style={{ marginBottom: 10 }}>Traffic by Channel</h4>
          <table className="data-table">
            <thead>
              <tr><th>Channel</th><th>Sessions</th><th>Users</th><th>Conversions</th></tr>
            </thead>
            <tbody>
              {sourceRows.map((r) => {
                const ch = r.dimensionValues[0].value;
                return (
                  <tr key={ch}>
                    <td><span className={`source-badge ${channelClass(ch)}`}>{ch}</span></td>
                    <td>{parseInt(r.metricValues[0].value).toLocaleString()}</td>
                    <td>{parseInt(r.metricValues[1].value).toLocaleString()}</td>
                    <td>{parseInt(r.metricValues[2].value).toLocaleString()}</td>
                  </tr>
                );
              })}
              {!sourceRows.length && <tr><td colSpan={4} className="kanban-empty">No data</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Top pages */}
        <div>
          <h4 style={{ marginBottom: 10 }}>Top Pages</h4>
          <table className="data-table">
            <thead>
              <tr><th>Page</th><th>Views</th><th>Users</th><th>Avg Time</th></tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => {
                const path  = r.dimensionValues[0].value;
                const title = r.dimensionValues[1].value;
                const dur2  = parseFloat(r.metricValues[2].value);
                const t     = dur2 >= 60 ? `${Math.floor(dur2/60)}m ${Math.round(dur2%60)}s` : `${Math.round(dur2)}s`;
                return (
                  <tr key={i}>
                    <td>
                      <div className="cell-strong" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={title}>{title || path}</div>
                      <div className="cell-sub">{path}</div>
                    </td>
                    <td>{parseInt(r.metricValues[0].value).toLocaleString()}</td>
                    <td>{parseInt(r.metricValues[1].value).toLocaleString()}</td>
                    <td>{t}</td>
                  </tr>
                );
              })}
              {!pageRows.length && <tr><td colSpan={4} className="kanban-empty">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function channelClass(ch) {
  if (!ch) return 'other';
  const c = ch.toLowerCase();
  if (c.includes('paid search') || c.includes('google')) return 'google';
  if (c.includes('paid social') || c.includes('organic social')) return 'meta';
  if (c.includes('organic')) return 'organic';
  return 'other';
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

/* ─────────────────────────────────────────────────────────────
   VIN Scanner — uses @zxing/browser (pure JS, no WASM)
   Works in all modern browsers: desktop Chrome, Firefox, Edge,
   Safari, iOS Safari, Android Chrome.
───────────────────────────────────────────────────────────── */
function VinScanner({ onScan, onClose }) {
  const videoRef   = useRef(null);
  const readerRef  = useRef(null);
  const [scanError, setScanError] = useState('');
  const [ready,     setReady]     = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let active = true;

    import('@zxing/browser').then(({ BrowserMultiFormatReader }) => {
      if (!active) return;

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // Get the back/environment camera
      BrowserMultiFormatReader.listVideoInputDevices()
        .then((devices) => {
          if (!active) return;
          if (!devices.length) {
            setScanError('No camera found. Please enter the VIN manually.');
            return;
          }
          // Prefer rear camera on mobile; fallback to first available
          const preferred = devices.find((d) =>
            /back|rear|environment/i.test(d.label)
          ) || devices[devices.length - 1];

          return reader.decodeFromVideoDevice(
            preferred.deviceId,
            videoRef.current,
            (result, err) => {
              if (!active) return;
              if (result) {
                setReady(true);
                // Strip Code-39 asterisk delimiters, uppercase, trim
                const vin = result.getText().replace(/\*/g, '').trim().toUpperCase();
                if (vin.length >= 5) {
                  active = false;
                  onScan(vin);
                }
              }
              if (err && !(err?.name === 'NotFoundException')) {
                // Only log non-expected decode errors
                console.warn('[VinScanner]', err);
              }
              if (!ready) setReady(true);
            }
          );
        })
        .catch((err) => {
          console.error('[VinScanner camera]', err);
          if (active) setScanError('Camera access denied. Please allow camera access or enter the VIN manually.');
        });
    }).catch((err) => {
      console.error('[VinScanner import]', err);
      if (active) setScanError('Scanner failed to load. Please enter the VIN manually.');
    });

    return () => {
      active = false;
      readerRef.current?.reset();
    };
  }, []);

  return (
    <div className="vin-scanner-overlay" onClick={onClose}>
      <div className="vin-scanner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vin-scanner-head">
          <h3>Scan VIN</h3>
          <button type="button" className="job-drawer-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="vin-scanner-hint">
          Point the camera at the VIN barcode on the door jamb sticker, windshield, or QR code.
        </p>
        {scanError ? (
          <p style={{ color: 'var(--rust,#b0522b)', textAlign: 'center', padding: '24px 0', fontSize: 14 }}>
            {scanError}
          </p>
        ) : (
          <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#111', minHeight: 180 }}>
            <video
              ref={videoRef}
              style={{ width: '100%', display: 'block' }}
              muted
              playsInline
            />
            {ready && <div className="vin-scan-reticle" />}
            {!ready && !scanError && (
              <p style={{ color: '#aaa', textAlign: 'center', padding: '48px 16px', fontSize: 13, margin: 0, position: 'absolute', inset: 0 }}>
                Starting camera…
              </p>
            )}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button type="button" className="button ghost sm" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Quote Builder
───────────────────────────────────────────────────────────── */
const PDR_PANELS = [
  // Front
  { id: 'hood',          label: 'Hood',               section: 'Front' },
  { id: 'lf_fender',    label: 'LF Fender',           section: 'Front' },
  { id: 'rf_fender',    label: 'RF Fender',            section: 'Front' },
  { id: 'front_bumper', label: 'Front Bumper Cover',   section: 'Front' },
  // Left Side
  { id: 'lf_door',      label: 'LF Door',              section: 'Left Side' },
  { id: 'lr_door',      label: 'LR Door',              section: 'Left Side' },
  { id: 'lr_quarter',   label: 'LR Quarter Panel',     section: 'Left Side' },
  { id: 'lf_rocker',   label: 'LF Rocker Panel',      section: 'Left Side' },
  // Right Side
  { id: 'rf_door',      label: 'RF Door',              section: 'Right Side' },
  { id: 'rr_door',      label: 'RR Door',              section: 'Right Side' },
  { id: 'rr_quarter',   label: 'RR Quarter Panel',     section: 'Right Side' },
  { id: 'rf_rocker',   label: 'RF Rocker Panel',      section: 'Right Side' },
  // Top
  { id: 'roof',         label: 'Roof',                 section: 'Top' },
  // Rear
  { id: 'trunk',        label: 'Trunk / Liftgate',     section: 'Rear' },
  { id: 'rear_bumper',  label: 'Rear Bumper Cover',    section: 'Rear' },
  // Other
  { id: 'lf_mirror',   label: 'LF Mirror Cap',        section: 'Other' },
  { id: 'rf_mirror',   label: 'RF Mirror Cap',        section: 'Other' },
];

const PANEL_SECTIONS = ['Front', 'Left Side', 'Right Side', 'Top', 'Rear', 'Other'];
const PANEL_METHODS  = ['PDR', 'R&I', 'R&R'];
const PANEL_SIZES    = ['Small', 'Medium', 'Large', 'Oversized'];

function buildBlankPanels() {
  const panels = {};
  PDR_PANELS.forEach((p) => {
    panels[p.id] = { checked: false, method: 'PDR', dents: '', size: 'Small', price: '' };
  });
  return panels;
}

const BLANK_QUOTE = {
  vin: '', year: '', make: '', model: '', color: '', plate: '',
  customerName: '', customerEmail: '', insuranceCompany: '', claimNumber: '',
  panels: buildBlankPanels(),
  notes: '',
};

/* ─────────────────────────────────────────────────────────────
   Pricing Matrix shared helpers
───────────────────────────────────────────────────────────── */
const DEFAULT_TIERS = ['Cash', 'Insurance Standard'];

// Industry-average starting suggestions (USD). Fully editable per shop.
const PRICING_DEFAULTS = {
  Small:     { hood: 75,  fender: 60, door: 65,  quarter: 80,  roof: 90,  trunk: 70,  bumper: 90,  rocker: 70,  mirror: 50 },
  Medium:    { hood: 150, fender: 110, door: 130, quarter: 160, roof: 180, trunk: 140, bumper: 175, rocker: 130, mirror: 90 },
  Large:     { hood: 275, fender: 200, door: 240, quarter: 290, roof: 325, trunk: 260, bumper: 320, rocker: 240, mirror: 150 },
  Oversized: { hood: 450, fender: 325, door: 395, quarter: 475, roof: 550, trunk: 425, bumper: 525, rocker: 395, mirror: 225 },
};

function panelCategory(panelId) {
  if (panelId === 'hood')                             return 'hood';
  if (panelId.endsWith('fender'))                     return 'fender';
  if (panelId.endsWith('door'))                       return 'door';
  if (panelId.endsWith('quarter'))                    return 'quarter';
  if (panelId === 'roof')                             return 'roof';
  if (panelId === 'trunk')                            return 'trunk';
  if (panelId.endsWith('bumper'))                     return 'bumper';
  if (panelId.endsWith('rocker'))                     return 'rocker';
  if (panelId.endsWith('mirror'))                     return 'mirror';
  return 'door';
}

function buildDefaultPricing() {
  const tiers = {};
  DEFAULT_TIERS.forEach((tier) => {
    const isInsurance = tier !== 'Cash';
    const mult = isInsurance ? 1.15 : 1; // insurance tier slightly higher by default
    tiers[tier] = {
      panels: {},
      riAddons: {},
    };
    PDR_PANELS.forEach((p) => {
      const cat = panelCategory(p.id);
      tiers[tier].panels[p.id] = {
        Small:     Math.round((PRICING_DEFAULTS.Small[cat]     || 75)  * mult),
        Medium:    Math.round((PRICING_DEFAULTS.Medium[cat]    || 150) * mult),
        Large:     Math.round((PRICING_DEFAULTS.Large[cat]     || 275) * mult),
        Oversized: Math.round((PRICING_DEFAULTS.Oversized[cat] || 450) * mult),
      };
      tiers[tier].riAddons[p.id] = 75; // flat R&I labor add-on
    });
  });
  return { tiers, activeTier: 'Cash' };
}

function loadPricing() {
  const saved = getPricing();
  if (saved && saved.tiers) return saved;
  return buildDefaultPricing();
}

function calculatePanelPrice(pricing, tierName, panelId, method, size) {
  if (!pricing || !pricing.tiers || !pricing.tiers[tierName]) return '';
  const tier = pricing.tiers[tierName];
  const base = tier.panels?.[panelId]?.[size] ?? 0;
  if (method === 'R&R') return ''; // manual entry
  if (method === 'R&I') return String(base + (tier.riAddons?.[panelId] ?? 0));
  return String(base); // PDR
}

/* ─────────────────────────────────────────────────────────────
   Pricing Matrix view
───────────────────────────────────────────────────────────── */
function PricingView() {
  const [pricing, setPricing]   = useState(() => loadPricing());
  const [activeTier, setActive] = useState(() => loadPricing().activeTier || 'Cash');
  const [savedMsg, setSavedMsg] = useState('');
  const [newTier,  setNewTier]  = useState('');

  const tier = pricing.tiers[activeTier];

  const setCell = (panelId, size, value) => {
    const num = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
    setPricing((p) => ({
      ...p,
      tiers: {
        ...p.tiers,
        [activeTier]: {
          ...p.tiers[activeTier],
          panels: {
            ...p.tiers[activeTier].panels,
            [panelId]: { ...p.tiers[activeTier].panels[panelId], [size]: num },
          },
        },
      },
    }));
  };

  const setRI = (panelId, value) => {
    const num = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
    setPricing((p) => ({
      ...p,
      tiers: {
        ...p.tiers,
        [activeTier]: {
          ...p.tiers[activeTier],
          riAddons: { ...p.tiers[activeTier].riAddons, [panelId]: num },
        },
      },
    }));
  };

  const handleSave = () => {
    const next = { ...pricing, activeTier };
    savePricing(next);
    setSavedMsg('Saved!');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const handleAddTier = () => {
    const name = newTier.trim();
    if (!name) return;
    if (pricing.tiers[name]) {
      alert('A tier with that name already exists.');
      return;
    }
    // Clone from current active tier as starting point
    setPricing((p) => ({
      ...p,
      tiers: {
        ...p.tiers,
        [name]: JSON.parse(JSON.stringify(p.tiers[activeTier])),
      },
    }));
    setActive(name);
    setNewTier('');
  };

  const handleDeleteTier = () => {
    if (Object.keys(pricing.tiers).length <= 1) {
      alert('You must keep at least one pricing tier.');
      return;
    }
    if (!window.confirm(`Delete pricing tier "${activeTier}"?`)) return;
    const next = { ...pricing.tiers };
    delete next[activeTier];
    const remaining = Object.keys(next)[0];
    setPricing((p) => ({ ...p, tiers: next }));
    setActive(remaining);
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Reset all tiers to industry-average defaults? Your custom rates will be lost.')) return;
    const fresh = buildDefaultPricing();
    setPricing(fresh);
    setActive(fresh.activeTier);
    savePricing(fresh);
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Pricing Matrix</h3>
            <p className="meta">Set per-panel rates for each customer tier or insurance carrier</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="button ghost sm" onClick={handleResetDefaults}>Reset to defaults</button>
            <button type="button" className="button primary sm" onClick={handleSave}>Save changes</button>
          </div>
        </div>

        <div className="panel-body">
          {/* Tier selector */}
          <div className="pricing-tier-bar">
            <label style={{ marginBottom: 0 }}>Active tier</label>
            <select value={activeTier} onChange={(e) => setActive(e.target.value)} style={{ flex: 1, maxWidth: 280, marginBottom: 0 }}>
              {Object.keys(pricing.tiers).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="button" className="button ghost sm" onClick={handleDeleteTier}>Delete tier</button>

            <span style={{ flex: 1 }} />

            <input
              type="text"
              value={newTier}
              onChange={(e) => setNewTier(e.target.value)}
              placeholder="e.g. State Farm DRP"
              style={{ marginBottom: 0, maxWidth: 220 }}
            />
            <button type="button" className="button primary sm" onClick={handleAddTier}>+ Add tier</button>
          </div>

          {savedMsg && <p className="portal-note" style={{ color: 'var(--sage,#4a7a5c)', marginBottom: 12 }}>✓ {savedMsg}</p>}

          {/* Pricing grid */}
          <div className="table-scroll">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Panel</th>
                  {PANEL_SIZES.map((s) => <th key={s} style={{ textAlign: 'right' }}>{s}</th>)}
                  <th style={{ textAlign: 'right', borderLeft: '2px solid var(--line,#e8e2db)' }}>R&amp;I add-on</th>
                </tr>
              </thead>
              <tbody>
                {PANEL_SECTIONS.map((section) => (
                  <Fragment key={section}>
                    <tr className="pricing-section-row">
                      <td colSpan={PANEL_SIZES.length + 2}>{section}</td>
                    </tr>
                    {PDR_PANELS.filter((p) => p.section === section).map((p) => (
                      <tr key={p.id}>
                        <td className="pricing-panel-name">{p.label}</td>
                        {PANEL_SIZES.map((size) => (
                          <td key={size} style={{ textAlign: 'right' }}>
                            <div className="pricing-cell">
                              <span className="pricing-cell-prefix">$</span>
                              <input
                                type="number"
                                min="0"
                                step="5"
                                value={tier.panels[p.id]?.[size] ?? 0}
                                onChange={(e) => setCell(p.id, size, e.target.value)}
                                className="pricing-cell-input"
                              />
                            </div>
                          </td>
                        ))}
                        <td style={{ textAlign: 'right', borderLeft: '2px solid var(--line,#e8e2db)' }}>
                          <div className="pricing-cell">
                            <span className="pricing-cell-prefix">$</span>
                            <input
                              type="number"
                              min="0"
                              step="5"
                              value={tier.riAddons[p.id] ?? 0}
                              onChange={(e) => setRI(p.id, e.target.value)}
                              className="pricing-cell-input"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <p className="meta" style={{ marginTop: 14, fontSize: 12 }}>
            <strong>How it works:</strong> When building a quote, select a tier — prices auto-fill as you check panels and pick a size.
            <br/>
            <strong>R&amp;I add-on</strong> = labor cost added on top of the PDR price when method is set to R&amp;I (Remove &amp; Install).
            <br/>
            <strong>R&amp;R</strong> (Remove &amp; Replace) is always entered manually since part costs vary by vehicle.
          </p>
        </div>
      </div>
    </div>
  );
}

function QuoteView({ vehicles }) {
  const [quote, setQuote]       = useState(BLANK_QUOTE);
  const [scanning, setScanning] = useState(false);
  const [pricing, setPricingState] = useState(() => loadPricing());
  const [activeTier, setActiveTier] = useState(() => loadPricing().activeTier || 'Cash');
  const [sending, setSending]   = useState(false);
  const [sendMsg, setSendMsg]   = useState(null); // { type: 'ok'|'err', text }

  // Refresh pricing whenever this view mounts (in case admin updated it)
  useEffect(() => {
    const fresh = loadPricing();
    setPricingState(fresh);
    if (!fresh.tiers[activeTier]) setActiveTier(Object.keys(fresh.tiers)[0]);
  }, []);

  const setField = (key) => (e) => setQuote((q) => ({ ...q, [key]: e.target.value }));

  const setPanel = (id, field, value) =>
    setQuote((q) => {
      const current = q.panels[id];
      const next    = { ...current, [field]: value };

      // Auto-fill price when checking, or when method/size changes
      const recompute =
        (field === 'checked' && value === true) ||
        (current.checked && (field === 'method' || field === 'size'));

      if (recompute && next.method !== 'R&R') {
        const auto = calculatePanelPrice(pricing, activeTier, id, next.method, next.size);
        if (auto) next.price = auto;
      }

      return { ...q, panels: { ...q.panels, [id]: next } };
    });

  const reapplyAllPrices = (tierName) => {
    setQuote((q) => {
      const nextPanels = { ...q.panels };
      Object.keys(nextPanels).forEach((id) => {
        const p = nextPanels[id];
        if (p.checked && p.method !== 'R&R') {
          const auto = calculatePanelPrice(pricing, tierName, id, p.method, p.size);
          if (auto) nextPanels[id] = { ...p, price: auto };
        }
      });
      return { ...q, panels: nextPanels };
    });
  };

  const handleTierChange = (e) => {
    const t = e.target.value;
    setActiveTier(t);
    reapplyAllPrices(t);
  };

  const total = Object.values(quote.panels).reduce((sum, p) => {
    if (!p.checked) return sum;
    return sum + (parseFloat(p.price) || 0);
  }, 0);

  const affectedCount = Object.values(quote.panels).filter((p) => p.checked).length;

  const handleVinScan = (vin) => {
    setQuote((q) => ({ ...q, vin }));
    setScanning(false);
  };

  const handleLinkJob = (e) => {
    const v = vehicles.find((veh) => veh.id === e.target.value);
    if (!v) return;
    setQuote((q) => ({
      ...q,
      vin: v.vin || '',
      year: v.year || '',
      make: v.make || '',
      model: v.model || '',
      color: v.color || '',
      plate: v.plate || '',
      customerName: v.customerName || '',
      insuranceCompany: v.insuranceCompany || '',
      claimNumber: v.claimNumber || '',
    }));
    e.target.value = '';
  };

  const handleClear = () => {
    if (window.confirm('Clear this quote and start over?')) {
      setQuote(BLANK_QUOTE);
      setSendMsg(null);
    }
  };

  const handleSendToCustomer = async () => {
    if (!quote.customerEmail) {
      setSendMsg({ type: 'err', text: 'Enter a customer email address first.' });
      return;
    }
    setSending(true);
    setSendMsg(null);
    try {
      const affected = PDR_PANELS.filter((p) => quote.panels[p.id].checked);
      const res = await fetch('/api/send-quote-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: quote.customerName,
          customerEmail: quote.customerEmail,
          year: quote.year, make: quote.make, model: quote.model,
          color: quote.color, plate: quote.plate, vin: quote.vin,
          insuranceCompany: quote.insuranceCompany, claimNumber: quote.claimNumber,
          notes: quote.notes,
          total,
          panels: affected.map((p) => ({
            label: p.label,
            method: quote.panels[p.id].method,
            dents: quote.panels[p.id].dents,
            size: quote.panels[p.id].size,
            price: quote.panels[p.id].price,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setSendMsg({ type: 'ok', text: `Quote sent to ${quote.customerEmail}` });
    } catch (err) {
      setSendMsg({ type: 'err', text: err.message || 'Failed to send — try again.' });
    } finally {
      setSending(false);
    }
  };

  const handleExportPDF = () => {
    const affected = PDR_PANELS.filter((p) => quote.panels[p.id].checked);
    const dateStr  = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const quoteNum = `AQ-${Date.now().toString().slice(-6)}`;
    const vehicle  = [quote.year, quote.make, quote.model].filter(Boolean).join(' ') || '—';

    const methodBadge = (m) => {
      const colors = { PDR: '#2d6b47', 'R&I': '#b56a00', 'R&R': '#c0392b' };
      const bg     = { PDR: '#e6f2ec', 'R&I': '#fff3e0', 'R&R': '#fdecea' };
      return `<span style="display:inline-block;background:${bg[m]||'#f0f0f0'};color:${colors[m]||'#333'};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:.03em">${m}</span>`;
    };

    const panelRows = affected.map((p) => {
      const pv = quote.panels[p.id];
      const isRR = pv.method === 'R&R';
      return `
        <tr>
          <td>${p.label}</td>
          <td style="text-align:center">${methodBadge(pv.method)}</td>
          <td style="text-align:center">${!isRR && pv.dents ? pv.dents : '—'}</td>
          <td style="text-align:center">${!isRR && pv.size ? pv.size : '—'}</td>
          <td style="text-align:right;font-weight:600">${pv.price ? `$${parseFloat(pv.price).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}` : '—'}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>All Dent PDR Estimate – ${quoteNum}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#1a1410;background:#fff;padding:32px 40px}
    /* Header */
    .hd{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #b0522b;margin-bottom:24px}
    .hd-brand{display:flex;flex-direction:column;gap:2px}
    .hd-brand strong{font-size:22px;font-weight:800;color:#b0522b;letter-spacing:-.5px}
    .hd-brand span{font-size:12px;color:#888}
    .hd-meta{text-align:right;line-height:1.6}
    .hd-meta .q-num{font-size:18px;font-weight:700;color:#b0522b}
    /* Info grid */
    .info-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px}
    .info-box{background:#fffbf6;border:1px solid #e8e2db;border-radius:8px;padding:12px 14px}
    .info-box h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9e8f84;margin-bottom:6px}
    .info-box p{font-size:12.5px;line-height:1.6;color:#1a1410}
    .info-box p span{color:#9e8f84}
    /* Table */
    h3.section{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9e8f84;padding-bottom:6px;border-bottom:1px solid #e8e2db;margin-bottom:0}
    table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:12.5px}
    thead th{background:#b0522b;color:#fff;padding:8px 10px;text-align:left;font-size:11px;font-weight:700;letter-spacing:.05em}
    thead th:last-child{text-align:right}
    tbody tr:nth-child(even) td{background:#fffbf6}
    tbody td{padding:7px 10px;border-bottom:1px solid #e8e2db;vertical-align:middle}
    .total-row td{font-weight:700;font-size:14px;background:#fff3ee!important;border-top:2px solid #b0522b;padding:10px}
    .total-row td:last-child{color:#b0522b;font-size:18px}
    /* Footer */
    .notes-box{background:#fffbf6;border:1px solid #e8e2db;border-radius:8px;padding:14px;margin-bottom:24px}
    .notes-box h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9e8f84;margin-bottom:6px}
    .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:24px}
    .sig-line{border-top:1px solid #1a1410;padding-top:6px;font-size:11px;color:#888;margin-top:40px}
    .footer{font-size:11px;color:#9e8f84;text-align:center;padding-top:16px;border-top:1px solid #e8e2db;line-height:1.7}
    @media print{body{padding:16px 20px}}
  </style>
</head>
<body>
  <div class="hd">
    <div class="hd-brand">
      <strong>All Dent PDR</strong>
      <span>Mobile Paintless Dent Repair</span>
      <span style="margin-top:4px;color:#555">1-855-425-5336 · alldentpdr.com</span>
    </div>
    <div class="hd-meta">
      <div class="q-num">ESTIMATE #${quoteNum}</div>
      <div style="font-size:12px;color:#555;margin-top:4px">Date: ${dateStr}</div>
      <div style="font-size:12px;color:#555">Valid for 30 days</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h4>Customer</h4>
      <p>${quote.customerName || '<span>—</span>'}</p>
    </div>
    <div class="info-box">
      <h4>Vehicle</h4>
      <p>${vehicle}</p>
      ${quote.color  ? `<p><span>Color: </span>${quote.color}</p>` : ''}
      ${quote.plate  ? `<p><span>Plate: </span>${quote.plate}</p>` : ''}
      ${quote.vin    ? `<p style="font-family:monospace;font-size:11px"><span>VIN: </span>${quote.vin}</p>` : ''}
    </div>
    <div class="info-box">
      <h4>Insurance</h4>
      <p>${quote.insuranceCompany || '<span>—</span>'}</p>
      ${quote.claimNumber ? `<p><span>Claim #: </span>${quote.claimNumber}</p>` : ''}
    </div>
  </div>

  <h3 class="section">Panel Assessment — Affected Panels Only</h3>
  <table>
    <thead>
      <tr>
        <th>Panel</th>
        <th style="text-align:center">Method</th>
        <th style="text-align:center">Dents</th>
        <th style="text-align:center">Size</th>
        <th style="text-align:right">Price</th>
      </tr>
    </thead>
    <tbody>
      ${panelRows || '<tr><td colspan="5" style="text-align:center;color:#9e8f84;padding:20px">No panels marked as affected.</td></tr>'}
      <tr class="total-row">
        <td colspan="4">Estimated Total</td>
        <td style="text-align:right">$${total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      </tr>
    </tbody>
  </table>

  ${quote.notes ? `
  <div class="notes-box">
    <h4>Notes / Exclusions</h4>
    <p style="font-size:12.5px;line-height:1.6;white-space:pre-wrap">${quote.notes.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
  </div>` : ''}

  <div class="sig-grid">
    <div>
      <div class="sig-line">Customer Signature</div>
    </div>
    <div>
      <div class="sig-line">Date</div>
    </div>
    <div>
      <div class="sig-line">All Dent PDR Technician</div>
    </div>
    <div>
      <div class="sig-line">Date</div>
    </div>
  </div>

  <div class="footer">
    <strong>All Dent PDR · Mobile Paintless Dent Repair</strong><br/>
    1-855-425-5336 · alldentpdr.com · alldentpdr@gmail.com<br/>
    This estimate is valid for 30 days from the date above. Prices subject to change upon physical inspection.<br/>
    Method key: PDR = Paintless Dent Repair &nbsp;|&nbsp; R&amp;I = Remove &amp; Install &nbsp;|&nbsp; R&amp;R = Remove &amp; Replace
  </div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div className="quote-wrap" id="quote-print-area">
      {scanning && <VinScanner onScan={handleVinScan} onClose={() => setScanning(false)} />}

      {/* ── Vehicle / Header ── */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>New Quote</h3>
            <p className="meta">Damage assessment &amp; price estimate</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {sendMsg && (
              <span style={{ fontSize: 13, color: sendMsg.type === 'ok' ? 'var(--sage,#4a7a5c)' : 'var(--rust,#b0522b)' }}>
                {sendMsg.text}
              </span>
            )}
            <button type="button" className="button ghost sm" onClick={handleClear}>Clear</button>
            <button type="button" className="button ghost sm" onClick={handleExportPDF}>Export PDF</button>
            <button type="button" className="button primary sm" onClick={handleSendToCustomer} disabled={sending}>
              {sending ? 'Sending…' : '✉ Send to Customer'}
            </button>
          </div>
        </div>

        <div className="panel-body">
          {/* Pricing tier — drives auto-fill of panel prices */}
          <div className="quote-tier-row">
            <div style={{ flex: 1 }}>
              <label>Pricing tier</label>
              <select value={activeTier} onChange={handleTierChange}>
                {Object.keys(pricing.tiers).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <p className="meta" style={{ margin: '0 0 12px', alignSelf: 'flex-end', fontSize: 12, paddingBottom: 10 }}>
              Prices auto-fill when you check a panel · Manage tiers in <strong>Pricing Matrix</strong>
            </p>
          </div>

          {vehicles.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <label>Auto-fill from existing job</label>
              <select defaultValue="" onChange={handleLinkJob}>
                <option value="">— Select a job to pre-fill —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} · {v.year} {v.make} {v.model} · {v.customerName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* VIN row */}
          <div className="quote-vin-row">
            <div style={{ flex: 1 }}>
              <label>VIN #</label>
              <input
                type="text"
                value={quote.vin}
                onChange={setField('vin')}
                maxLength={17}
                placeholder="17-character VIN"
                className="quote-vin-input"
              />
            </div>
            <button type="button" className="button primary btn-scan-vin" onClick={() => setScanning(true)}>
              📷 Scan VIN
            </button>
          </div>

          <div className="form-grid-3" style={{ marginTop: 10 }}>
            <div><label>Year</label><input type="text" value={quote.year} onChange={setField('year')} placeholder="2022" /></div>
            <div><label>Make</label><input type="text" value={quote.make} onChange={setField('make')} placeholder="Honda" /></div>
            <div><label>Model</label><input type="text" value={quote.model} onChange={setField('model')} placeholder="Accord" /></div>
          </div>
          <div className="form-grid-3" style={{ marginTop: 8 }}>
            <div><label>Color</label><input type="text" value={quote.color} onChange={setField('color')} /></div>
            <div><label>Plate</label><input type="text" value={quote.plate} onChange={setField('plate')} style={{ textTransform: 'uppercase' }} /></div>
            <div><label>Customer name</label><input type="text" value={quote.customerName} onChange={setField('customerName')} /></div>
          </div>
          <div style={{ marginTop: 8 }}>
            <label>Customer email <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 12 }}>(required to send quote)</span></label>
            <input type="email" value={quote.customerEmail} onChange={setField('customerEmail')} placeholder="customer@example.com" />
          </div>
          <div className="form-grid-2" style={{ marginTop: 8 }}>
            <div><label>Insurance company</label><input type="text" value={quote.insuranceCompany} onChange={setField('insuranceCompany')} /></div>
            <div><label>Claim #</label><input type="text" value={quote.claimNumber} onChange={setField('claimNumber')} /></div>
          </div>
        </div>
      </div>

      {/* ── Panel Assessment ── */}
      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head">
          <div>
            <h3>Panel Assessment</h3>
            <p className="meta">{affectedCount} panel{affectedCount !== 1 ? 's' : ''} affected · Check each damaged panel</p>
          </div>
          <div className="quote-method-legend">
            <span className="qlabel pdr">PDR</span>
            <span className="qlabel ri">R&amp;I</span>
            <span className="qlabel rr">R&amp;R</span>
          </div>
        </div>

        <div className="quote-panel-wrap">
          {PANEL_SECTIONS.map((section) => {
            const sectionPanels = PDR_PANELS.filter((p) => p.section === section);
            return (
              <div key={section} className="quote-panel-section">
                <div className="quote-section-label">{section}</div>
                <div className="table-scroll">
                  <table className="quote-panel-table">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}></th>
                        <th>Panel</th>
                        <th style={{ width: 100 }}>Method</th>
                        <th style={{ width: 72 }}>Dents</th>
                        <th style={{ width: 110 }}>Size</th>
                        <th style={{ width: 100 }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionPanels.map((p) => {
                        const pv = quote.panels[p.id];
                        const isRR = pv.method === 'R&R';
                        return (
                          <tr key={p.id} className={`quote-panel-row${pv.checked ? ' is-affected' : ''}`}>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={pv.checked}
                                onChange={(e) => setPanel(p.id, 'checked', e.target.checked)}
                                aria-label={`Mark ${p.label} affected`}
                              />
                            </td>
                            <td className="quote-panel-name">{p.label}</td>
                            <td>
                              {pv.checked && (
                                <select value={pv.method} onChange={(e) => setPanel(p.id, 'method', e.target.value)} className="quote-select">
                                  {PANEL_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                              )}
                            </td>
                            <td>
                              {pv.checked && !isRR && (
                                <input
                                  type="number"
                                  value={pv.dents}
                                  onChange={(e) => setPanel(p.id, 'dents', e.target.value)}
                                  min="0"
                                  className="quote-num-input"
                                  placeholder="0"
                                />
                              )}
                            </td>
                            <td>
                              {pv.checked && !isRR && (
                                <select value={pv.size} onChange={(e) => setPanel(p.id, 'size', e.target.value)} className="quote-select">
                                  {PANEL_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              )}
                            </td>
                            <td>
                              {pv.checked && (
                                <div className="quote-price-cell">
                                  <span className="quote-price-prefix">$</span>
                                  <input
                                    type="number"
                                    value={pv.price}
                                    onChange={(e) => setPanel(p.id, 'price', e.target.value)}
                                    min="0"
                                    step="5"
                                    className="quote-price-input"
                                    placeholder="0"
                                  />
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Total + Notes ── */}
      <div className="panel quote-footer-panel" style={{ marginTop: 20 }}>
        <div className="quote-footer-inner">
          <div style={{ flex: 1 }}>
            <label>Notes / Exclusions</label>
            <textarea rows="4" value={quote.notes} onChange={setField('notes')} placeholder="Repair conditions, exclusions, special instructions…" />
          </div>
          <div className="quote-total-box">
            <div className="quote-total-label">Estimated Total</div>
            <div className="quote-total-amount">${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="quote-total-meta">{affectedCount} panel{affectedCount !== 1 ? 's' : ''} · All Dent PDR</div>
            <button type="button" className="button ghost" style={{ width: '100%', marginTop: 14 }} onClick={handleExportPDF}>
              Export PDF
            </button>
            <button type="button" className="button primary" style={{ width: '100%', marginTop: 8 }} onClick={handleSendToCustomer} disabled={sending}>
              {sending ? 'Sending…' : '✉ Send to Customer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Vehicle Release Form Modal
───────────────────────────────────────────────────────────── */
function buildReleaseHtml(job, data) {
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const vehicle = [job.year, job.make, job.model].filter(Boolean).join(' ') || '—';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>All Dent PDR — Vehicle Release — ${esc(job.id)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#1a1410;background:#fff;padding:32px 40px}
    .hd{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:3px solid #b0522b;margin-bottom:24px}
    .hd-brand strong{font-size:22px;font-weight:800;color:#b0522b}
    .hd-brand span{display:block;font-size:12px;color:#888;margin-top:2px}
    .hd-meta{text-align:right;font-size:12px;color:#555;line-height:1.7}
    .hd-meta .title{font-size:18px;font-weight:800;color:#1a1410;display:block;margin-bottom:4px}
    .info-row{display:flex;gap:0;border:1px solid #e8e2db;border-radius:8px;overflow:hidden;margin-bottom:20px}
    .info-cell{flex:1;padding:10px 14px;border-right:1px solid #e8e2db}
    .info-cell:last-child{border-right:none}
    .info-cell .lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9e8f84;display:block;margin-bottom:3px}
    .info-cell .val{font-size:13px;color:#1a1410}
    .agreement{background:#fffbf6;border:1px solid #e8e2db;border-left:3px solid #b0522b;border-radius:0 8px 8px 0;padding:14px 16px;font-size:13px;line-height:1.7;margin-bottom:24px}
    .notes-box{background:#fffbf6;border:1px solid #e8e2db;border-radius:8px;padding:12px 14px;margin-bottom:20px}
    .notes-box .lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9e8f84;margin-bottom:6px}
    .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:28px}
    .sig-line{border-top:1.5px solid #1a1410;padding-top:6px;font-size:11px;color:#888;margin-top:44px}
    .sig-line .sig-val{display:block;font-size:16px;font-style:italic;color:#1a1410;margin-bottom:6px;margin-top:-36px}
    .footer{font-size:11px;color:#9e8f84;text-align:center;padding-top:14px;border-top:1px solid #e8e2db;line-height:1.8}
    @media print{body{padding:16px 20px}}
  </style>
</head>
<body>
  <div class="hd">
    <div class="hd-brand">
      <strong>All Dent PDR</strong>
      <span>Mobile Paintless Dent Repair</span>
      <span style="margin-top:2px;color:#555">1-855-425-5336 &nbsp;·&nbsp; alldentpdr@gmail.com</span>
    </div>
    <div class="hd-meta">
      <span class="title">VEHICLE RELEASE FORM</span>
      <span>Job #${esc(job.id)}</span><br/>
      <span>Date: ${esc(dateStr)}</span>
    </div>
  </div>

  <div class="info-row">
    <div class="info-cell"><span class="lbl">Customer</span><span class="val">${esc(job.customerName)}</span></div>
    <div class="info-cell"><span class="lbl">Year</span><span class="val">${esc(job.year)}</span></div>
    <div class="info-cell"><span class="lbl">Make</span><span class="val">${esc(job.make)}</span></div>
    <div class="info-cell"><span class="lbl">Model</span><span class="val">${esc(job.model)}</span></div>
  </div>
  <div class="info-row">
    <div class="info-cell" style="flex:3"><span class="lbl">VIN</span><span class="val" style="font-family:monospace">${esc(job.vin || '—')}</span></div>
    <div class="info-cell"><span class="lbl">Deductible</span><span class="val">${esc(job.deductible || '—')}</span></div>
    <div class="info-cell"><span class="lbl">Paid</span><span class="val">${esc(data.paid || '—')}</span></div>
  </div>

  ${job.notes ? `<div class="notes-box"><div class="lbl">Repair Notes</div><p style="font-size:13px;line-height:1.6;white-space:pre-wrap">${esc(job.notes)}</p></div>` : ''}

  <p class="agreement">
    The repairs on the vehicle listed above have been completed, as explained to me by All Dent PDR.
    I am fully satisfied with the outcome of the repairs on the vehicle listed above. I understand
    the limited lifetime warranty, and payment for the work has been paid in full.
  </p>

  <div class="sig-grid">
    <div>
      <div class="sig-line">
        ${data.custSig ? `<span class="sig-val">${esc(data.custSig)}</span>` : ''}
        Customer Signature &nbsp;&nbsp; Date: ${esc(data.signedAt || '')}
      </div>
    </div>
    <div>
      <div class="sig-line">
        ${data.witnessedBy ? `<span class="sig-val">${esc(data.witnessedBy)}</span>` : ''}
        Witnessed By (All Dent PDR) &nbsp;&nbsp; Date: ${esc(data.witnessedAt || '')}
      </div>
    </div>
  </div>

  <div class="footer">
    <strong>All Dent PDR · Mobile Paintless Dent Repair</strong><br/>
    1-855-425-5336 · alldentpdr.com · alldentpdr@gmail.com
  </div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;
}

function VehicleReleaseModal({ job, onClose, onSaved }) {
  const existing = job.releaseFormData || {};
  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

  const [paid, setPaid]             = useState(existing.paid    || job.deductible || '');
  const [custSig, setCustSig]       = useState(existing.custSig || '');
  const [signedAt, setSignedAt]     = useState(existing.signedAt || '');
  const [witnessedBy, setWitnessBy] = useState(existing.witnessedBy || '');
  const [witnessedAt, setWitnessAt] = useState(existing.witnessedAt || '');
  const [saving, setSaving]         = useState(false);
  const [sending, setSending]       = useState(false);
  const [sendMsg, setSendMsg]       = useState(null);

  const handleCustSig = (e) => {
    setCustSig(e.target.value);
    if (e.target.value && !signedAt) setSignedAt(today);
  };

  const handleWitness = (e) => {
    setWitnessBy(e.target.value);
    if (e.target.value && !witnessedAt) setWitnessAt(today);
  };

  const releaseData = {
    paid,
    custSig,
    signedAt:    signedAt    || today,
    witnessedBy,
    witnessedAt: witnessedAt || today,
    savedAt:     new Date().toISOString(),
  };

  const handleExportPDF = () => {
    const html = buildReleaseHtml(job, releaseData);
    const win = window.open('', '_blank', 'width=820,height=680');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleSendEmail = async () => {
    if (!job.email) {
      setSendMsg({ type: 'err', text: 'No customer email on file for this job.' });
      return;
    }
    setSending(true);
    setSendMsg(null);
    try {
      const res = await fetch('/api/send-release-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId:        job.id,
          customerName: job.customerName,
          email:        job.email,
          year:         job.year,
          make:         job.make,
          model:        job.model,
          vin:          job.vin,
          deductible:   job.deductible,
          paid,
          notes:        job.notes,
          custSig,
          signedAt:     releaseData.signedAt,
          witnessedBy,
          witnessedAt:  releaseData.witnessedAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setSendMsg({ type: 'ok', text: `Release form sent to ${job.email}` });
    } catch (err) {
      setSendMsg({ type: 'err', text: err.message || 'Failed to send — try again.' });
    } finally {
      setSending(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveReleaseForm(job.id, releaseData);
      onSaved({ ...job, releaseFormData: releaseData });
    } catch (err) {
      console.error('[saveRelease]', err);
      setSaving(false);
    }
  };

  return (
    <div className="release-modal-overlay" onClick={onClose}>
      <div className="release-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="release-modal-head">
          <div>
            <p className="crumb" style={{ margin: 0 }}>Job {job.id} · {job.year} {job.make} {job.model}</p>
            <h3 style={{ margin: '2px 0 0' }}>Vehicle Release Form</h3>
          </div>
          <button type="button" className="job-drawer-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className="release-modal-body">

          {/* Contact header */}
          <div style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--line,#e8e2db)' }}>
            <p style={{ fontSize: 13, color: 'var(--muted,#9e8f84)', marginBottom: 4 }}>
              855-425-5336 &nbsp;·&nbsp; alldentpdr@gmail.com
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--rust,#b0522b)' }}>
              Vehicle Release Form
            </p>
          </div>

          {/* Pre-filled vehicle / customer info (read-only) */}
          <div className="release-info-grid">
            <div className="release-info-row">
              <span className="release-info-label">Customer</span>
              <span className="release-info-val">{job.customerName}</span>
            </div>
            <div className="release-info-row three">
              <div><span className="release-info-label">Year</span><span className="release-info-val">{job.year}</span></div>
              <div><span className="release-info-label">Make</span><span className="release-info-val">{job.make}</span></div>
              <div><span className="release-info-label">Model</span><span className="release-info-val">{job.model}</span></div>
            </div>
            <div className="release-info-row">
              <span className="release-info-label">VIN</span>
              <span className="release-info-val" style={{ fontFamily: 'monospace', fontSize: 13 }}>{job.vin || '—'}</span>
            </div>
          </div>

          {/* Deductible / Paid */}
          <div className="form-grid-2" style={{ marginTop: 14 }}>
            <div>
              <label>Deductible</label>
              <input type="text" value={job.deductible || ''} readOnly tabIndex={-1}
                style={{ background: 'var(--sky,#eef5fb)', color: 'var(--muted)' }} />
            </div>
            <div>
              <label>Paid <span aria-hidden>*</span></label>
              <input type="text" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="$500.00" />
            </div>
          </div>

          {/* Notes (read-only) */}
          {job.notes && (
            <div style={{ marginTop: 12 }}>
              <label>Repair Notes</label>
              <textarea rows={3} value={job.notes} readOnly tabIndex={-1}
                style={{ background: 'var(--sky,#eef5fb)', color: 'var(--muted)', resize: 'none' }} />
            </div>
          )}

          {/* Agreement text */}
          <div className="reg-legal-box" style={{ marginTop: 14 }}>
            <p className="reg-legal" style={{ marginBottom: 0 }}>
              The repairs on the vehicle listed above have been completed, as explained to me by All Dent PDR.
              I am fully satisfied with the outcome of the repairs on the vehicle listed above. I understand
              the limited lifetime warranty, and payment for the work has been paid in full.
            </p>
          </div>

          {/* Signature row */}
          <div className="form-grid-2" style={{ marginTop: 16 }}>
            <div>
              <label>Customer Signature — type full name <span aria-hidden>*</span></label>
              <input
                type="text"
                value={custSig}
                onChange={handleCustSig}
                placeholder="Customer full name"
                className="reg-sig-input"
              />
            </div>
            <div>
              <label>Date Signed</label>
              <input type="text" value={signedAt || today} readOnly
                style={{ fontFamily: 'monospace', fontSize: 13, background: 'var(--sky,#eef5fb)' }} />
            </div>
          </div>

          {/* Witness row */}
          <div className="form-grid-2" style={{ marginTop: 10 }}>
            <div>
              <label>Witnessed By (All Dent PDR Rep) <span aria-hidden>*</span></label>
              <input
                type="text"
                value={witnessedBy}
                onChange={handleWitness}
                placeholder="Technician / representative name"
              />
            </div>
            <div>
              <label>Date Witnessed</label>
              <input type="text" value={witnessedAt || today} readOnly
                style={{ fontFamily: 'monospace', fontSize: 13, background: 'var(--sky,#eef5fb)' }} />
            </div>
          </div>

          {sendMsg && (
            <p style={{ marginTop: 12, fontSize: 13, fontWeight: 600,
              color: sendMsg.type === 'ok' ? 'var(--sage,#4a7a5c)' : 'var(--rust,#b0522b)' }}>
              {sendMsg.text}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="release-modal-foot">
          <button type="button" className="button ghost sm" onClick={onClose}>Cancel</button>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="button ghost sm" onClick={handleExportPDF}>
              Export PDF / Print
            </button>
            <button type="button" className="button ghost sm" onClick={handleSendEmail} disabled={sending}>
              {sending ? 'Sending…' : '✉ Send Email'}
            </button>
            <button
              type="button"
              className="button primary sm"
              onClick={handleSave}
              disabled={saving || !custSig.trim() || !witnessedBy.trim()}
            >
              {saving ? 'Saving…' : '✓ Save & Sign'}
            </button>
          </div>
        </div>

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

/* ----------------- MessagesView ----------------- */

function formatChatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function MessagesView({ conversations, activeId, onSelect, messages, loading, onReply }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const scrollerRef = useRef(null);
  const active = conversations.find((c) => c.id === activeId) || null;

  useEffect(() => { setDraft(''); setErr(''); }, [activeId]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages.length, activeId]);

  async function submitReply(e) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    setErr('');
    try {
      await onReply(draft);
      setDraft('');
    } catch (e2) {
      setErr(e2.message || 'Could not send');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="panel chat-admin">
      <div className="chat-admin-grid">
        <aside className="chat-admin-list">
          <div className="chat-admin-list-head">
            <strong>Conversations</strong>
            <span className="meta">{conversations.length}</span>
          </div>
          {!conversations.length && (
            <div className="kanban-empty" style={{ padding: 24 }}>
              No messages yet. When a visitor opens the website chat box, their conversation appears here.
            </div>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chat-admin-row${activeId === c.id ? ' is-active' : ''}`}
              onClick={() => onSelect(c.id)}
            >
              <div className="chat-admin-row-top">
                <span className="cell-strong">{c.visitor_name || c.visitor_email || 'Anonymous visitor'}</span>
                <span className="cell-sub">{formatChatTime(c.last_message_at)}</span>
              </div>
              <div className="chat-admin-row-preview">
                {c.last_message_preview || '—'}
              </div>
              <div className="chat-admin-row-foot">
                {c.visitor_email && <span className="cell-sub">{c.visitor_email}</span>}
                {c.unread_admin > 0 && <span className="chat-admin-unread">{c.unread_admin}</span>}
              </div>
            </button>
          ))}
        </aside>

        <div className="chat-admin-thread">
          {!active && (
            <div className="kanban-empty" style={{ padding: 32 }}>
              {conversations.length ? 'Select a conversation to start replying.' : 'Waiting for the first visitor message…'}
            </div>
          )}
          {active && (
            <>
              <header className="chat-admin-thread-head">
                <div>
                  <strong>{active.visitor_name || 'Anonymous visitor'}</strong>
                  <div className="cell-sub">
                    {[active.visitor_email, active.visitor_phone].filter(Boolean).join(' · ') || '—'}
                  </div>
                  {active.page_url && (
                    <div className="cell-sub" title={active.page_url}>
                      From: {active.page_url.length > 60 ? active.page_url.slice(0, 60) + '…' : active.page_url}
                    </div>
                  )}
                </div>
              </header>
              <div className="chat-admin-log" ref={scrollerRef}>
                {loading && <div className="kanban-empty">Loading…</div>}
                {!loading && messages.map((m) => (
                  <div key={m.id} className={`chat-msg chat-msg-${m.sender === 'admin' ? 'admin-out' : 'visitor-in'}`}>
                    <div className="chat-bubble">{m.body}</div>
                    <div className="chat-meta">
                      {m.sender === 'admin' ? (m.sender_name || 'You') : (m.sender_name || 'Visitor')} · {formatChatTime(m.created_at)}
                    </div>
                  </div>
                ))}
                {!loading && !messages.length && (
                  <div className="kanban-empty">No messages in this conversation.</div>
                )}
              </div>
              <form className="chat-composer" onSubmit={submitReply}>
                {err && <div className="chat-error">{err}</div>}
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your reply…"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitReply(e);
                    }
                  }}
                />
                <button type="submit" className="button primary" disabled={sending || !draft.trim()}>
                  {sending ? 'Sending…' : 'Send reply'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

