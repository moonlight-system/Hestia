export type NotifPrefs = { enabled: boolean; morning: boolean; silent: boolean; activity: boolean };

export const NOTIF_EVENT = "hestia-notif-prefs";
const KEY = "hestia-notif-prefs";
const DEFAULTS: NotifPrefs = { enabled: true, morning: true, silent: false, activity: true };

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