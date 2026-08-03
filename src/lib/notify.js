// Browser desktop notifications + a lightweight chime for the admin dashboard
// (new leads, new chat messages). Uses the native Notification API — no
// service worker / push subscription required since this only needs to
// alert an admin who already has the dashboard tab open somewhere.

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function showBrowserNotification(title, options = {}) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return null;
  try {
    const notification = new Notification(title, {
      icon: '/images/logo.jpg',
      ...options,
    });
    if (options.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick();
        notification.close();
      };
    }
    return notification;
  } catch (err) {
    console.warn('[notify] failed to show notification', err);
    return null;
  }
}

let sharedAudioCtx;

/** Short two-tone chime, synthesized with the Web Audio API (no audio asset needed). */
export function playChime() {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    sharedAudioCtx = sharedAudioCtx || new Ctx();
    const ctx = sharedAudioCtx;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const start = now + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch {
    // Ignore autoplay-policy / unsupported browser errors.
  }
}
