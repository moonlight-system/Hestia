import type { Event } from "./Types";

export function startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

export function addDays(d: Date, n: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

// Clamps the day so Jan 31 + 1 month = Feb 28, not March 3
export function addMonths(d: Date, n: number): Date {
    const x = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const lastDay = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
    x.setDate(Math.min(d.getDate(), lastDay));
    return x;
}

// Weeks start on Monday
export function startOfWeek(d: Date): Date {
    const x = startOfDay(d);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
}

export function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

// 6 weeks x 7 days, always the same size so the month grid never jumps
export function monthGrid(d: Date): Date[] {
    const first = startOfWeek(startOfMonth(d));
    return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}

// Multi-day events appear on every day they overlap
export function eventsOnDay(events: Event[], day: Date): Event[] {
    const from = startOfDay(day);
    const to = addDays(from, 1);
    return events.filter((ev) =>
        ev.end && ev.end > ev.start
            ? ev.start < to && ev.end > from
            : ev.start >= from && ev.start < to
    );
}

export function timeLabel(d: Date): string {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function rangeLabel(ev: Event): string {
    if (!ev.end) return timeLabel(ev.start);
    if (sameDay(ev.start, ev.end)) return `${timeLabel(ev.start)} – ${timeLabel(ev.end)}`;
    const f = (d: Date) =>
        d.toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    return `${f(ev.start)} → ${f(ev.end)}`;
}

// Date -> "2026-10-25T14:30", the format <input type="datetime-local"> needs
export function toInputValue(d: Date): string {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}