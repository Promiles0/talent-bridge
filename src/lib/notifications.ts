// Sound + Push Notification Utilities (Web Audio API — no file dependencies)

const STORAGE_KEYS = {
  soundEnabled: "tb-notification-sound",
  pushEnabled: "tb-push-notifications",
  aiEnabled: "tb-ai-suggestions",
};

export function isNotificationSoundEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEYS.soundEnabled) !== "false";
}

export function setNotificationSoundEnabled(v: boolean) {
  localStorage.setItem(STORAGE_KEYS.soundEnabled, String(v));
}

export function isPushEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEYS.pushEnabled) !== "false";
}

export function setPushEnabled(v: boolean) {
  localStorage.setItem(STORAGE_KEYS.pushEnabled, String(v));
}

export function isAISuggestionsEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEYS.aiEnabled) !== "false";
}

export function setAISuggestionsEnabled(v: boolean) {
  localStorage.setItem(STORAGE_KEYS.aiEnabled, String(v));
}

/** Play a pleasant two-tone chime using Web Audio API */
export function playNotificationSound() {
  if (!isNotificationSoundEnabled()) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    playTone(880, 0, 0.15);
    playTone(1174.66, 0.12, 0.2);
    setTimeout(() => ctx.close(), 500);
  } catch {
    // Silently fail if Web Audio not available
  }
}

/** Request browser notification permission */
export async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Send a browser push notification */
export function sendBrowserNotification(title: string, body?: string, link?: string) {
  if (!isPushEnabled()) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body: body || undefined,
      icon: "/placeholder.svg",
      tag: "tb-notification",
    });
    if (link) {
      n.onclick = () => {
        window.focus();
        window.location.href = link;
      };
    }
    setTimeout(() => n.close(), 5000);
  } catch {
    // Silently fail
  }
}
