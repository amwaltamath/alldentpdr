import { useEffect, useState } from 'react';
import {
  clearSession,
  getSession,
  getVendorLeads,
  isRemotePortalEnabled,
  isRemoteVendor,
  respondToVendorLead,
  setSession,
  signInRemoteAdmin,
  signOutRemoteAdmin,
} from './portal/storage';

const STATUS_LABELS = {
  offered: 'New offer',
  accepted: 'Accepted',
  declined: 'Declined',
  completed: 'Completed',
};

function phoneHref(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? `tel:+1${digits.replace(/^1/, '')}` : null;
}

export default function VendorPortal() {
  const [ready, setReady] = useState(false);
  const [session, setLocalSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noteById, setNoteById] = useState({});
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = getSession();
      if (stored?.role === 'vendor' && isRemotePortalEnabled()) {
        const allowed = await isRemoteVendor();
        if (!active) return;
        if (allowed) setLocalSession(stored);
        else {
          clearSession();
          await signOutRemoteAdmin();
        }
      }
      if (active) setReady(true);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const next = await getVendorLeads();
        if (active) setLeads(next);
      } catch (err) {
        if (active) setAuthError(err?.message || 'Unable to load assigned leads.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [session]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (!isRemotePortalEnabled()) {
        throw new Error('Vendor sign-in needs Supabase configured.');
      }
      await signInRemoteAdmin(email.trim(), password);
      const allowed = await isRemoteVendor();
      if (!allowed) {
        await signOutRemoteAdmin();
        throw new Error('This login is not an active vendor shop. Ask All Dent to add this email under Vendors.');
      }
      const next = { role: 'vendor', email: email.trim().toLowerCase(), loggedInAt: new Date().toISOString() };
      setSession(next);
      setLocalSession(next);
      setPassword('');
    } catch (err) {
      setAuthError(err?.message || 'Sign-in failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOutRemoteAdmin();
    clearSession();
    setLocalSession(null);
    setLeads([]);
  };

  const handleRespond = async (lead, status) => {
    setBusyId(lead.id);
    setAuthError('');
    try {
      const note = noteById[lead.id] || '';
      await respondToVendorLead(lead.id, status, note);
      setLeads((prev) => prev.map((item) => (
        item.id === lead.id
          ? { ...item, assignment_status: status, vendor_response_note: note.trim() || item.vendor_response_note }
          : item
      )));
    } catch (err) {
      setAuthError(err?.message || 'Could not update this lead.');
    } finally {
      setBusyId(null);
    }
  };

  if (!ready) {
    return <section className="panel"><div className="kanban-empty">Loading…</div></section>;
  }

  if (!session) {
    return (
      <section className="portal-shell">
        <div className="portal-wrap">
          <div className="portal-card portal-login-card">
            <span className="section-label">Vendor portal</span>
            <h2>Shop sign-in</h2>
            <p className="muted">Leads All Dent sends to your shop show up here. You only see jobs assigned to you.</p>
            <form onSubmit={handleLogin}>
              <label htmlFor="vendor-email">Email</label>
              <input id="vendor-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <label htmlFor="vendor-pass">Password</label>
              <input id="vendor-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {authError && <p className="portal-error">{authError}</p>}
              <button className="button primary" type="submit" disabled={authLoading} style={{ width: '100%', marginTop: 4 }}>
                {authLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="portal-note"><a href="/">← Back to alldentpdr.com</a></p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="portal-shell vendor-portal">
      <div className="vendor-portal-bar">
        <div>
          <span className="section-label">Vendor portal</span>
          <h2>Assigned leads</h2>
        </div>
        <button type="button" className="button ghost sm" onClick={handleLogout}>Sign out</button>
      </div>
      {authError && <p className="portal-error">{authError}</p>}
      {loading && <p className="kanban-empty">Loading leads…</p>}
      {!loading && !leads.length && <p className="kanban-empty">No leads assigned yet.</p>}
      <div className="vendor-lead-list">
        {leads.map((lead) => {
          const call = phoneHref(lead.phone);
          const locked = lead.assignment_status === 'completed' || lead.assignment_status === 'declined';
          return (
            <article key={lead.id} className="vendor-lead-card">
              <div className="vendor-lead-top">
                <strong>{lead.name || 'Lead'}</strong>
                <span className="badge registered">{STATUS_LABELS[lead.assignment_status] || 'New offer'}</span>
              </div>
              <p className="vendor-lead-meta">
                {[lead.vehicle, lead.location].filter(Boolean).join(' · ') || 'No vehicle listed'}
              </p>
              <p className="vendor-lead-note">{lead.message || 'No note.'}</p>
              {lead.assignment_note && <p className="cell-sub">From All Dent: {lead.assignment_note}</p>}
              <div className="vendor-lead-links">
                {call && <a href={call}>{lead.phone}</a>}
                {lead.email && <a href={`mailto:${lead.email}`}>{lead.email}</a>}
              </div>
              <label>
                Note back to All Dent
                <textarea
                  rows={2}
                  value={noteById[lead.id] ?? lead.vendor_response_note ?? ''}
                  onChange={(e) => setNoteById((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                  disabled={locked || busyId === lead.id}
                />
              </label>
              <div className="vendor-lead-actions">
                <button type="button" className="button primary sm" disabled={locked || busyId === lead.id} onClick={() => handleRespond(lead, 'accepted')}>Accept</button>
                <button type="button" className="button ghost sm" disabled={locked || busyId === lead.id} onClick={() => handleRespond(lead, 'declined')}>Decline</button>
                <button type="button" className="button ghost sm" disabled={lead.assignment_status === 'declined' || lead.assignment_status === 'completed' || busyId === lead.id} onClick={() => handleRespond(lead, 'completed')}>Mark complete</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
