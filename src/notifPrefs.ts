export type NotifPrefs = { enabled: boolean; leadHours: number; silent: boolean };

export const LEADS = [
    { hours: 1, label: "1 hour before" },
    { hours: 3, label: "3 hours before" },
    { hours: 6, label: "6 hours before" },
    { hours: 12, label: "12 hours before" },
    { hours: 24, label: "1 day before" },
    { hours: 48, label: "2 days before" },
];

export const NOTIF_EVENT = "hestia-notif-prefs";
const KEY = "hestia-notif-prefs";
const DEFAULTS: NotifPrefs = { enabled: true, leadHours: 3, silent: false };

export function loadNotifPrefs(): NotifPrefs {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
        return DEFAULTS;
    }
}

export function saveNotifPrefs(p: NotifPrefs) {
    try {
        localStorage.setItem(KEY, JSON.stringify(p));
    } catch {
        // storage unavailable: the choice just won't survive a restart
    }
    // Tells the reminder scheduler (which is mounted elsewhere) to rebuild
    window.dispatchEvent(new Event(NOTIF_EVENT));
}