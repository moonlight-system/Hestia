import { useEffect, useRef } from "react";
import {
    createChannel, Importance, isPermissionGranted,
    requestPermission, sendNotification,
} from "@tauri-apps/plugin-notification";
import { auth } from "./firebase";
import { useAsks } from "./useAsks";
import { useTasks } from "./useTasks";
import { loadNotifPrefs } from "./notifPrefs";

// "since" = the moment this device first ran this feature. Items created before
// it never notify (otherwise a fresh install would announce everything).
// "ids" = items already handled, so nothing notifies twice.
type Seen = { since: number; ids: string[] };
const KEY = "hestia-activity";

function save(s: Seen) {
    try {
        localStorage.setItem(KEY, JSON.stringify({ since: s.since, ids: s.ids.slice(-300) }));
    } catch {
        // storage unavailable: worst case, a notification repeats after a restart
    }
}

function load(): Seen {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        // fall through to a fresh state
    }
    const fresh: Seen = { since: Date.now(), ids: [] };
    save(fresh);
    return fresh;
}

async function notify(title: string, body: string) {
    const prefs = loadNotifPrefs();
    if (!prefs.activity) return;
    try {
        let ok = await isPermissionGranted();
        if (!ok) ok = (await requestPermission()) === "granted";
        if (!ok) return;

        // Creating an existing channel is harmless
        await createChannel({
            id: "activity", name: "New asks and tasks",
            importance: Importance.High, vibration: true,
        });
        await createChannel({
            id: "activity_silent", name: "New asks and tasks (silent)",
            importance: Importance.Low, vibration: false,
        });

        sendNotification({
            // Reminders use ids 1-50, so stay well above that
            id: 1000 + Math.floor(Math.random() * 1_000_000_000),
            title,
            body,
            channelId: prefs.silent ? "activity_silent" : "activity",
        });
    } catch (err) {
        console.error("Activity notification failed:", err);
    }
}

export function useActivityNotifications() {
    const { tasks } = useTasks();
    const asks = useAsks();
    const seen = useRef<Seen>(load());

    useEffect(() => {
        const me = auth.currentUser?.uid;
        if (!me) return;

        const s = seen.current;
        const known = new Set(s.ids);
        const toSend: { title: string; body: string }[] = [];

        for (const a of asks) {
            const key = "ask:" + a.id;
            if (known.has(key) || a.createdAt.getTime() <= s.since) continue;
            known.add(key);
            if (a.author.id !== me) {
                toSend.push({ title: `New ask from ${a.author.name}`, body: a.content });
            }
        }

        for (const t of tasks) {
            const key = "task:" + t.id;
            if (known.has(key) || t.createdAt.getTime() <= s.since) continue;
            known.add(key);
            // Tasks without createdBy come from older app versions: never notify
            if (!t.createdBy || t.createdBy === me) continue;

            const forMe =
                t.mode === "anyone"
                || (t.mode === "assigned" && t.assignee?.id === me)
                || (t.mode === "each" && t.participants.some((p) => p.id === me));
            if (forMe) {
                toSend.push({
                    title: t.mode === "anyone" ? "New task for anyone" : "New task for you",
                    body: t.name,
                });
            }
        }

        if (known.size === s.ids.length) return;   // nothing new
        s.ids = [...known];
        save(s);

        // One after the other, so permission prompts can't overlap
        (async () => {
            for (const n of toSend) await notify(n.title, n.body);
        })();
    }, [asks, tasks]);
}