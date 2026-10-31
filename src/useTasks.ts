import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useHouseholdId } from "./HouseholdContext";
import { sameDay, startOfDay } from "./calendarUtils";
import { HISTORY_LIMIT, isComplete, targetCycle } from "./taskUtils";
import type { Task } from "./Types";

export function useTasks(): { tasks: Task[]; today: Date } {
    const hid = useHouseholdId();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [today, setToday] = useState(() => startOfDay(new Date()));

    // Notice when midnight passes while the app stays open
    useEffect(() => {
        const id = setInterval(() => {
            const now = startOfDay(new Date());
            setToday((prev) => (sameDay(prev, now) ? prev : now));
        }, 60_000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        return onSnapshot(
            collection(db, "households", hid, "tasks"),
            (snap) => {
                setTasks(snap.docs.map((d) => {
                    const data = d.data();
                    return {
                        id: d.id,
                        name: data.name,
                        description: data.description,
                        mode: data.mode ?? "anyone",
                        assignee: data.assignee,
                        participants: data.participants ?? [],
                        repeat: data.repeat,
                        date: data.date ? data.date.toDate() : undefined,
                        time: data.time,
                        cycle: data.cycle ?? 0,
                        done: data.done ?? [],
                        completedAt: data.completedAt ? data.completedAt.toDate() : undefined,
                        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
                        createdBy: data.createdBy,
                    } as Task;
                }));
            },
            (err) => console.error("Tasks listener failed:", err),
        );
    }, [hid]);

    // Housekeeping. Any roommate's app may do this; the writes are idempotent.
    useEffect(() => {
        const col = collection(db, "households", hid, "tasks");

        // 1. Repeating tasks that are due for a new round start over
        for (const t of tasks) {
            const k = targetCycle(t, today);
            if (k !== t.cycle) {
                updateDoc(doc(col, t.id), { cycle: k, done: [] }).catch(console.error);
            }
        }

        // 2. Only the 5 most recent completed one-time tasks are kept
        const finished = tasks
            .filter((t) => !t.repeat && isComplete(t))
            .sort((a, b) =>
                (b.completedAt ?? b.createdAt).getTime() - (a.completedAt ?? a.createdAt).getTime());
        for (const t of finished.slice(HISTORY_LIMIT)) {
            deleteDoc(doc(col, t.id)).catch(console.error);
        }
    }, [tasks, today, hid]);

    return { tasks, today };
}