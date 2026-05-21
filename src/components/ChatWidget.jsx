import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'alldentpdr_chat_v1';
const POLL_INTERVAL_MS = 5000;

function loadState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(state) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function makeToken() {
  // 32-char URL-safe token
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now()}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

function timeLabel(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

export default function ChatWidget() {
  const initial = typeof window === 'undefined' ? null : loadState();
  const [token] = useState(() => (initial?.token) || makeToken());
  const [started, setStarted] = useState(Boolean(initial?.started));
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [unread, setUnread] = useState(0);
  const lastSeenRef = useRef(null);
  const scrollerRef = useRef(null);

  // Persist token + identity
  useEffect(() => {
    saveState({ token, started, name, email, phone });
  }, [token, started, name, email, phone]);

  // Poll for messages once conversation is started
  useEffect(() => {
    if (!started) return;
    let cancelled = false;

    async function poll() {
      try {
        const qs = new URLSearchParams({ token });
        if (lastSeenRef.current) qs.set('since', lastSeenRef.current);
        const res = await fetch(`/api/chat/poll?${qs.toString()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const incoming = data.messages || [];
        if (incoming.length) {
          lastSeenRef.current = incoming[incoming.length - 1].created_at;
          setMessages((prev) => {
            // de-dup by id
            const ids = new Set(prev.map((m) => m.id));
            const merged = [...prev];
            for (const m of incoming) if (!ids.has(m.id)) merged.push(m);
            return merged;
          });
          if (!open) {
            const adminNew = incoming.filter((m) => m.sender === 'admin').length;
            if (adminNew) setUnread((u) => u + adminNew);
          }
        }
      } catch { /* ignore */ }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [started, token, open]);

  // Clear unread when opened, scroll to bottom
  useEffect(() => {
    if (open) setUnread(0);
    if (open && scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [open, messages.length]);

  async function handleStart(e) {
    e.preventDefault();
    setError('');
    const trimmedMsg = draft.trim();
    if (!trimmedMsg) { setError('Please enter a message.'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token, name: name.trim(), email: email.trim(), phone: phone.trim(),
          page_url: typeof window !== 'undefined' ? window.location.href : '',
          message: trimmedMsg,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Could not start chat');
      }
      // Optimistic: show own message right away
      setMessages([{
        id: `local-${Date.now()}`,
        sender: 'visitor',
        sender_name: name.trim() || null,
        body: trimmedMsg,
        created_at: new Date().toISOString(),
      }]);
      lastSeenRef.current = new Date().toISOString();
      setDraft('');
      setStarted(true);
    } catch (err) {
      setError(err.message || 'Could not start chat');
    } finally {
      setSending(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError('');
    const optimistic = {
      id: `local-${Date.now()}`,
      sender: 'visitor',
      sender_name: name.trim() || null,
      body: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, message: trimmed }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Could not send');
      }
    } catch (err) {
      setError(err.message || 'Could not send');
      // Roll back optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(trimmed);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          className="chat-fab"
          onClick={() => setOpen(true)}
          aria-label="Open live chat"
        >
          <span className="chat-fab-icon" aria-hidden="true">💬</span>
          <span className="chat-fab-label">Chat with us</span>
          {unread > 0 && <span className="chat-fab-badge">{unread}</span>}
        </button>
      )}

      {open && (
        <div className="chat-panel" role="dialog" aria-label="Live chat">
          <header className="chat-head">
            <div>
              <strong>All Dent PDR</strong>
              <span className="chat-head-sub">We typically reply in a few minutes</span>
            </div>
            <button
              type="button"
              className="chat-close"
              onClick={() => setOpen(false)}
              aria-label="Minimize chat"
            >×</button>
          </header>

          {!started ? (
            <form className="chat-intro" onSubmit={handleStart}>
              <p className="chat-intro-lead">
                Hi! Send us a quick message — dent question, hail damage estimate, anything.
                We'll respond as soon as possible.
              </p>
              <label>
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  autoComplete="name"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com (optional)"
                  autoComplete="email"
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  autoComplete="tel"
                />
              </label>
              <label>
                Message
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="How can we help?"
                  rows={3}
                  required
                />
              </label>
              {error && <div className="chat-error">{error}</div>}
              <button type="submit" className="chat-send-btn" disabled={sending}>
                {sending ? 'Sending…' : 'Start chat'}
              </button>
              <p className="chat-foot-note">
                Prefer the phone? Call <a href="tel:18554255336">855-425-5336</a>
              </p>
            </form>
          ) : (
            <>
              <div className="chat-log" ref={scrollerRef}>
                <div className="chat-system">
                  Chat started · we'll text/email you back if you leave this page
                </div>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`chat-msg chat-msg-${m.sender}`}
                  >
                    <div className="chat-bubble">{m.body}</div>
                    <div className="chat-meta">
                      {m.sender === 'admin' ? (m.sender_name || 'All Dent PDR') : 'You'} · {timeLabel(m.created_at)}
                    </div>
                  </div>
                ))}
              </div>
              <form className="chat-composer" onSubmit={handleSend}>
                {error && <div className="chat-error">{error}</div>}
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <button type="submit" className="chat-send-btn" disabled={sending || !draft.trim()}>
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
