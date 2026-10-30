import type { Event } from "../Types";
import {
    addDays, eventsOnDay, monthGrid, rangeLabel, sameDay, startOfDay, startOfWeek, timeLabel,
} from "../calendarUtils";
import { type CSSProperties } from "react";
import { isAndroid } from "../platform";


export type ViewProps = {
    date: Date;
    events: Event[];
    onAdd: (day: Date) => void;
    onOpenDay: (day: Date) => void;
    onOpenMonth: (day: Date) => void;
    onEventClick: (ev: Event) => void;
    onEventContext: (ev: Event, x: number, y: number) => void;
    onToggleDone: (ev: Event) => void;
};

function tooltip(ev: Event): string {
    return ev.person && ev.person.length > 0
        ? `${ev.name} — ${ev.person.map((p) => p.name).join(", ")}`
        : ev.name;
}

function EventChip({ ev, showTime, onClick, onContext }: {
    ev: Event;
    showTime?: boolean;
    onClick: (ev: Event) => void;
    onContext: (ev: Event, x: number, y: number) => void;
}){
    return(
        <div
            className={ev.done ? "cal_chip done" : "cal_chip"}
            style={ev.color ? ({ "--chip-color": ev.color } as CSSProperties) : undefined}
            title={tooltip(ev)}
            onClick={(e) => { e.stopPropagation(); onClick(ev); }}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onContext(ev, e.clientX, e.clientY);
            }}
        >
            {showTime && <span className="cal_chip_time">{timeLabel(ev.start)}</span>}
            {ev.name}
        </div>
    )
}

function YearView({ date, events, onOpenDay, onOpenMonth }: ViewProps){
    const today = new Date();
    const year = date.getFullYear();
    const letters = Array.from({ length: 7 }, (_, i) =>
        addDays(startOfWeek(today), i).toLocaleDateString([], { weekday: "narrow" }));

    return(
        <div className="cal_year">
            {Array.from({ length: 12 }, (_, m) => {
                const first = new Date(year, m, 1);
                const offset = (first.getDay() + 6) % 7;
                const count = new Date(year, m + 1, 0).getDate();
                return(
                    <div className="cal_mini" key={m}>
                        <button className="cal_mini_title" onClick={() => onOpenMonth(first)}>
                            {first.toLocaleDateString([], { month: "long" })}
                        </button>
                        <div className="cal_mini_grid">
                            {letters.map((l, i) => <div key={i} className="cal_mini_wd">{l}</div>)}
                            {Array.from({ length: offset }, (_, i) => <div key={"b" + i} />)}
                            {Array.from({ length: count }, (_, i) => {
                                const day = new Date(year, m, i + 1);
                                const cls = "cal_mini_day"
                                    + (sameDay(day, today) ? " today" : "")
                                    + (eventsOnDay(events, day).length > 0 ? " has_events" : "");
                                return(
                                    <button key={i} className={cls} onClick={() => onOpenDay(day)}>
                                        {i + 1}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function MonthView({ date, events, onAdd, onOpenDay, onEventClick, onEventContext }: ViewProps){
    const today = new Date();
    const days = monthGrid(date);
    const weekdays = days.slice(0, 7).map((d) => d.toLocaleDateString([], { weekday: "short" }));
    const MAX = 3;

    return(
        <div className="cal_month">
            <div className="cal_weekdays">
                {weekdays.map((w) => <div key={w}>{w}</div>)}
            </div>
            <div className="cal_month_grid">
                {days.map((day) => {
                    const list = eventsOnDay(events, day);
                    const cls = "cal_cell"
                        + (day.getMonth() !== date.getMonth() ? " other" : "")
                        + (sameDay(day, today) ? " today" : "");
                    return(
                        <div
                            key={day.toISOString()}
                            className={cls}
                            onClick={isAndroid ? () => onOpenDay(day) : undefined}
                        >
                            <div className="cal_cell_head">
                                <button className="cal_daynum" onClick={() => onOpenDay(day)}>
                                    {day.getDate()}
                                </button>
                                {!isAndroid && (
                                    <button className="cal_add" title="Add event" onClick={() => onAdd(day)}>
                                        +
                                    </button>
                                )}
                            </div>
                            {list.slice(0, MAX).map((ev) => (
                                <EventChip
                                    key={ev.id}
                                    ev={ev}
                                    onClick={isAndroid ? () => onOpenDay(day) : onEventClick}
                                    onContext={isAndroid ? () => {} : onEventContext}
                                />
                            ))}
                            {list.length > MAX && (
                                <button className="cal_more" onClick={() => onOpenDay(day)}>
                                    +{list.length - MAX} more
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const DEFAULT_MIN = 60;      // events with no end time are drawn this long
const MIN_BLOCK_MIN = 30;    // very short events are stretched so they stay readable
const HOURS = Array.from({ length: 24 }, (_, h) => h);


type Placed = { ev: Event; startMin: number; endMin: number; col: number; cols: number };

// Works out where each event of one day goes: minutes from midnight, plus a
// column index so overlapping events sit side by side instead of on top of each other
function layoutDay(events: Event[], day: Date): Placed[] {
    const dayStart = startOfDay(day).getTime();
    const dayEnd = addDays(startOfDay(day), 1).getTime();

    const items: Placed[] = eventsOnDay(events, day)
        .map((ev) => {
            // Multi-day events are clipped to the part that falls on this day
            const s = Math.max(ev.start.getTime(), dayStart);
            const hasEnd = ev.end && ev.end > ev.start;
            const e = hasEnd ? Math.min(ev.end!.getTime(), dayEnd) : s + DEFAULT_MIN * 60_000;
            const startMin = (s - dayStart) / 60_000;
            const endMin = Math.min(1440, Math.max((e - dayStart) / 60_000, startMin + MIN_BLOCK_MIN));
            return { ev, startMin, endMin, col: 0, cols: 1 };
        })
        .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

    // A "cluster" is a run of events that overlap each other (directly or through
    // a chain). All events in a cluster share the same number of columns.
    let cluster: Placed[] = [];
    let clusterEnd = 0;
    const closeCluster = () => {
        const n = Math.max(...cluster.map((i) => i.col)) + 1;
        cluster.forEach((i) => { i.cols = n; });
        cluster = [];
    };

    for (const it of items) {
        if (cluster.length && it.startMin >= clusterEnd) closeCluster();
        // Take the first column not used by an event that's still running
        const taken = cluster.filter((c) => c.endMin > it.startMin).map((c) => c.col);
        let col = 0;
        while (taken.includes(col)) col++;
        it.col = col;
        cluster.push(it);
        clusterEnd = Math.max(clusterEnd, it.endMin);
    }
    if (cluster.length) closeCluster();

    return items;
}

function TimedEvent({ p, onClick, onContext }: {
    p: Placed;
    onClick: (ev: Event) => void;
    onContext: (ev: Event, x: number, y: number) => void;
}){
    const { ev } = p;
    const style = {
        top: `${(p.startMin / 1440) * 100}%`,
        height: `${((p.endMin - p.startMin) / 1440) * 100}%`,
        left: `${(p.col / p.cols) * 100}%`,
        width: `${100 / p.cols}%`,
        ...(ev.color ? { "--chip-color": ev.color } : {}),
    } as CSSProperties;

    return(
        <div
            className={ev.done ? "cal_block done" : "cal_block"}
            style={style}
            title={tooltip(ev)}
            onClick={(e) => { e.stopPropagation(); onClick(ev); }}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onContext(ev, e.clientX, e.clientY);
            }}
        >
            <span className="cal_block_time">{timeLabel(ev.start)}</span> {ev.name}
        </div>
    )
}

function WeekRows({ date, events, onOpenDay }: ViewProps){
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date), i));

    return(
        <div className="cal_wr">
            {days.map((day) => {
                // Ordered by start time; eventsOnDay returns a fresh array, so sorting is safe
                const list = eventsOnDay(events, day)
                    .sort((a, b) => a.start.getTime() - b.start.getTime());
                return(
                    <div
                        key={day.toISOString()}
                        className={"cal_wr_row" + (sameDay(day, today) ? " today" : "")}
                        onClick={() => onOpenDay(day)}
                    >
                        <div className="cal_wr_label">
                            <span>{day.toLocaleDateString([], { weekday: "short" })}</span>
                            <strong>{day.getDate()}</strong>
                        </div>
                        <div className="cal_wr_events">
                            {list.map((ev) => (
                                <div
                                    key={ev.id}
                                    className={ev.done ? "cal_wr_event done" : "cal_wr_event"}
                                    style={ev.color ? ({ "--chip-color": ev.color } as CSSProperties) : undefined}
                                >
                                    <span className="cal_wr_time">{timeLabel(ev.start)}</span> {ev.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// Phones get the row layout, desktop keeps the columns
function WeekView(props: ViewProps){
    return isAndroid ? <WeekRows {...props} /> : <WeekColumns {...props} />;
}

function WeekColumns({ date, events, onAdd, onOpenDay, onEventClick, onEventContext }: ViewProps){
    const today = new Date();
    const start = startOfWeek(date);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    return(
        <div className="cal_week">
            <div className="cal_week_header">
                <div className="cal_week_gutter" />
                {days.map((day) => (
                    <div
                        key={day.toISOString()}
                        className={"cal_week_head" + (sameDay(day, today) ? " today" : "")}
                    >
                        <button className="cal_week_day" onClick={() => onOpenDay(day)}>
                            <span>{day.toLocaleDateString([], { weekday: "short" })}</span>
                            <strong>{day.getDate()}</strong>
                        </button>
                        <button className="cal_add" title="Add event" onClick={() => onAdd(day)}>
                            +
                        </button>
                    </div>
                ))}
            </div>

            <div className="cal_week_scroll">
                <div className="cal_week_body">
                    <div className="cal_week_gutter cal_hours">
                        {HOURS.map((h) => (
                            <div key={h} className="cal_hour_label">
                                {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
                            </div>
                        ))}
                    </div>
                    {days.map((day) => (
                        <div
                            key={day.toISOString()}
                            className={"cal_week_col" + (sameDay(day, today) ? " today" : "")}
                        >
                            {layoutDay(events, day).map((p) => (
                                <TimedEvent
                                    key={p.ev.id}
                                    p={p}
                                    onClick={onEventClick}
                                    onContext={onEventContext}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function DayView({ date, events, onAdd, onEventClick, onEventContext, onToggleDone }: ViewProps){
    const list = eventsOnDay(events, date);

    return(
        <div className="cal_day">
            <button className="cal_day_add" onClick={() => onAdd(date)}>+ Add event</button>
            {list.length === 0 && <div className="cal_empty">Nothing planned this day.</div>}
            {list.map((ev) => (
                <div
                    key={ev.id}
                    className={ev.done ? "cal_card done" : "cal_card"}
                    style={ev.color ? ({ "--chip-color": ev.color } as CSSProperties) : undefined}
                    onClick={() => onEventClick(ev)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        onEventContext(ev, e.clientX, e.clientY);
                    }}
                >
                    <div className="cal_card_main">
                        <div className="cal_card_name">{ev.name}</div>
                        <div className="cal_card_time">{rangeLabel(ev)}</div>
                        {ev.person && ev.person.length > 0 && (
                            <div className="cal_card_people">
                                {ev.person.map((p) => p.name).join(", ")}
                            </div>
                        )}
                    </div>
                    <label
                        className="cal_card_check"
                        title={ev.done ? "Mark as not done" : "Mark as done"}
                        onClick={(e) => e.stopPropagation()}   // don't open the edit modal
                    >
                        <input
                            type="checkbox"
                            checked={!!ev.done}
                            onChange={() => onToggleDone(ev)}
                        />
                    </label>
                </div>
            ))}
        </div>
    )
}

export { YearView, MonthView, WeekView, DayView }