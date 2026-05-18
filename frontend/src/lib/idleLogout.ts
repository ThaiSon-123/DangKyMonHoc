export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const IDLE_WARNING_MS = 14 * 60 * 1000;
export const ACTIVITY_THROTTLE_MS = 1000;
export const LAST_ACTIVITY_KEY = "dkmh:last-activity";

export const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "touchstart",
  "scroll",
  "click",
] as const;

export function readLastActivity(): number {
  const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function writeLastActivity(ts: number = Date.now()) {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(ts));
}
