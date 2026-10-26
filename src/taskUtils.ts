import { addDays, addMonths } from "./calendarUtils";
import type { Repeat, Task } from "./Types";

export const HISTORY_LIMIT = 5;

// The k-th due date, always computed from the first one so months never drift
export function occurrence(anchor: Date, repeat: Repeat, k: number): Date {
    const n = Math.max(1, Math.floor(repeat.every));
    switch (repeat.unit) {
        case "days": return addDays(anchor, n * k);
        case "weeks": return addDays(anchor, n * 7 * k);
        case "months": return addMonths(anchor, n * k);
    }
}

export function dueOf(task: Task): Date | undefined {
    if (!task.date) return undefined;
    return task.repeat ? occurrence(task.date, task.repeat, task.cycle) : task.date;
}

export function nextDueOf(task: Task): Date | undefined {
    if (!task.date || !task.repeat) return undefined;
    return occurrence(task.date, task.repeat, task.cycle + 1);
}

export function isComplete(task: Task): boolean {
    switch (task.mode) {
        case "anyone":
            return task.done.length > 0;
        case "assigned":
            return !!task.assignee && task.done.includes(task.assignee.id);
        case "each":
            return task.participants.length > 0
                && task.participants.every((p) => task.done.includes(p.id));
    }
}

// Which cycle the task should be on today. Moves forward when:
//  - the task is done and its due day has passed, or
//  - a whole interval has passed without it being done (a missed round)
export function targetCycle(task: Task, today: Date): number {
    if (!task.repeat || !task.date) return task.cycle;
    const { date, repeat } = task;
    let k = task.cycle;
    if (isComplete(task) && today > occurrence(date, repeat, k)) k++;
    while (occurrence(date, repeat, k + 1) <= today) k++;
    return k;
}

export function repeatLabel(r: Repeat): string {
    const unit = r.unit === "days" ? "day" : r.unit === "weeks" ? "week" : "month";
    return r.every === 1 ? `Every ${unit}` : `Every ${r.every} ${unit}s`;
}

// Date -> "2026-10-25", the format <input type="date"> needs
export function toDateInput(d: Date): string {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}