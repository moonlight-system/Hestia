import { useEffect, useState } from "react";
import {
    cancelAll, createChannel, Importance, isPermissionGranted,
    requestPermission, Schedule, sendNotification,
} from "@tauri-apps/plugin-notification";
import { auth } from "./firebase";
import { useTasks } from "./useTasks";
import { startOfDay } from "./calendarUtils";
import { occurrence, targetCycle } from "./taskUtils";
import { loadNotifPrefs, NOTIF_EVENT } from "./notifPrefs";
import type { Task } from "./Types";

const HORIZON_DAYS = 14;   // only schedule this far ahead; refreshed whenever the app opens
const MAX_PENDING = 50;
const HOUR = 3_600_000;
const MORNING_HOUR = 6;

// Runs are queued so two quick changes can't interleave their cancel/schedule calls
let chain: Promise<void> = Promise.resolve();
let runId = 0;

// Combines a due day with an "HH:MM" string
function withTime(day: Date, time: string): Date {
    const [h, m] = time.split(":").map(Number);
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
}

// Does this task still need something from me?
function needsMe(task: Task, me: string): boolean {
    switch (task.mode) {
        case "assigned":
            return task.assignee?.id === me && !task.done.includes(me);
        case "each":
            return task.participants.some((p) => p.id === me) && !task.done.includes(me);
        case "anyone":
            return task.done.length === 0;
    }
}

function dueText(due: Date, at: Date): string {
    const days = Math.round((startOfDay(due).getTime() - startOfDay(at).getTime()) / 86_400_000);
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `Due ${due.toLocaleDateString([], { day: "numeric", month: "short" })}`;
}

export function useTaskReminders() {
    const { tasks, today } = useTasks();
    const [prefs, setPrefs] = useState(loadNotifPrefs);

    // Rebuild when the settings page changes something
    useEffect(() => {
        const onChange = () => setPrefs(loadNotifPrefs());
        window.addEventListener(NOTIF_EVENT, onChange);
        return () => window.removeEventListener(NOTIF_EVENT, onChange);
    }, []);

    useEffect(() => {
        const me = auth.currentUser?.uid;
        if (!me) return;
        const myRun = ++runId;

        chain = chain.then(async () => {
            if (myRun !== runId) return;   // a newer run replaced this one
            try {
                await cancelAll();
                if (!prefs.enabled) return;

                let granted = await isPermissionGranted();
                if (!granted) granted = (await requestPermission()) === "granted";
                if (!granted) return;

                // A channel's sound can't be changed after creation, so we use two
                await createChannel({
                    id: "tasks", name: "Task reminders",
                    importance: Importance.High, vibration: true,
                });
                await createChannel({
                    id: "tasks_silent", name: "Task reminders (silent)",
                    importance: Importance.Low, vibration: false,
                });

                const now = Date.now();
                const horizon = now + HORIZON_DAYS * 24 * HOUR;
                const lead = prefs.leadHours * HOUR;
                const items: { at: Date; title: string; body: string }[] = [];

                for (const raw of tasks) {
                    // Use the cycle the task *should* be on today, even if no
                    // device has saved that change to Firestore yet
                    const k0 = targetCycle(raw, today);
                    const task: Task = k0 === raw.cycle ? raw : { ...raw, cycle: k0, done: [] };
                    if (!task.date) continue;

                    for (let k = task.cycle; k < task.cycle + 60; k++) {
                        const due = task.repeat ? occurrence(task.date, task.repeat, k) : task.date;
                        const morning = new Date(due.getFullYear(), due.getMonth(), due.getDate(), MORNING_HOUR, 0);
                        const dueAt = task.time ? withTime(due, task.time) : undefined;
                        const early = dueAt ? new Date(dueAt.getTime() - lead) : undefined;

                        // Rounds only move forward in time: stop at the first one past the horizon
                        const first = early && early < morning ? early : morning;
                        if (first.getTime() > horizon) break;

                        // Only the current round can already be ticked
                        const round = k === task.cycle ? task : { ...task, done: [] };
                        if (needsMe(round, me)) {
                            // 1. Morning reminder (skipped if the task is due before 6:00 anyway)
                            if (morning.getTime() > now && (!dueAt || dueAt > morning)) {
                                items.push({
                                    at: morning,
                                    title: task.name,
                                    body: `Due today${task.time ? ` at ${task.time}` : ""}`,
                                });
                            }
                            // 2. Reminder before the due time
                            if (dueAt && early && early.getTime() > now) {
                                items.push({
                                    at: early,
                                    title: task.name,
                                    body: `${dueText(due, early)} at ${task.time}`,
                                });
                            }
                        }
                        if (!task.repeat) break;
                    }
                }

                items.sort((a, b) => a.at.getTime() - b.at.getTime());
                for (const [i, it] of items.slice(0, MAX_PENDING).entries()) {
                    if (myRun !== runId) return;
                    sendNotification({
                        id: i + 1,
                        title: it.title,
                        body: it.body,
                        channelId: prefs.silent ? "tasks_silent" : "tasks",
                        schedule: Schedule.at(it.at, false, true),
                    });
                }
            } catch (err) {
                console.error("Scheduling reminders failed:", err);
            }
        });
    }, [tasks, today, prefs]);
}