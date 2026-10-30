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

// Keeps the day of d but takes the hours and minutes of ref
function withTimeOf(d: Date, ref: Date): Date {
    const x = new Date(d);
    x.setHours(ref.getHours(), ref.getMinutes(), 0, 0);
    return x;
}

// All occurrences of a repeating event that touch [from, to).
// Non-repeating events come back unchanged. Always computed from the first
// occurrence, so months never drift (Jan 31 -> Feb 28 -> Mar 31).
export function expandEvent(ev: Event, from: Date, to: Date): Event[] {
    const r = ev.repeat;
    if (!r) return [ev];

    const duration = ev.end ? ev.end.getTime() - ev.start.getTime() : undefined;
    const out: Event[] = [];
    const visible = (s: Date) => s < to && s.getTime() + (duration ?? 0) >= from.getTime();
    const push = (start: Date) => out.push({
        ...ev,
        start,
        end: duration !== undefined ? new Date(start.getTime() + duration) : undefined,
        origStart: ev.start,
        origEnd: ev.end,
        done: !!ev.doneAt?.includes(start.getTime()),   // <-- new
    });

    if ("monthDay" in r) {
        let y = ev.start.getFullYear();
        let m = ev.start.getMonth();
        for (let i = 0; i < 5000; i++, m++) {
            const last = new Date(y, m + 1, 0).getDate();
            const s = new Date(y, m, Math.min(r.monthDay, last), ev.start.getHours(), ev.start.getMinutes());
            if (s >= to) break;
            if (s >= startOfDay(ev.start) && visible(s)) push(s);
        }
    } else {
        const n = Math.max(1, Math.floor(r.every));
        const at = (k: number): Date => {
            switch (r.unit) {
                case "days": return addDays(ev.start, n * k);
                case "weeks": return addDays(ev.start, 7 * n * k);
                case "months": return withTimeOf(addMonths(ev.start, n * k), ev.start);
                case "years": return withTimeOf(addMonths(ev.start, 12 * n * k), ev.start);
            }
        };
        for (let k = 0; k < 20000; k++) {
            const s = at(k);
            if (s >= to) break;
            if (visible(s)) push(s);
        }
    }
    return out;
}