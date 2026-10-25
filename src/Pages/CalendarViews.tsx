import type { Event } from "../Types";
import {
    addDays, eventsOnDay, monthGrid, rangeLabel, sameDay, startOfWeek, timeLabel,
} from "../calendarUtils";
import type { CSSProperties } from "react";

export type ViewProps = {
    date: Date;
    events: Event[];
    onAdd: (day: Date) => void;
    onOpenDay: (day: Date) => void;
    onOpenMonth: (day: Date) => void;
    onEventClick: (ev: Event) => void;
    onEventContext: (ev: Event, x: number, y: number) => void;
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
            className="cal_chip"
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
                        <div key={day.toISOString()} className={cls}>
                            <div className="cal_cell_head">
                                <button className="cal_daynum" onClick={() => onOpenDay(day)}>
                                    {day.getDate()}
                                </button>
                                <button className="cal_add" title="Add event" onClick={() => onAdd(day)}>
                                    +
                                </button>
                            </div>
                            {list.slice(0, MAX).map((ev) => (
                                <EventChip
                                    key={ev.id}
                                    ev={ev}
                                    onClick={onEventClick}
                                    onContext={onEventContext}
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

function WeekView({ date, events, onAdd, onOpenDay, onEventClick, onEventContext }: ViewProps){
    const today = new Date();
    const start = startOfWeek(date);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    return(
        <div className="cal_week">
            {days.map((day) => {
                const list = eventsOnDay(events, day);
                return(
                    <div
                        key={day.toISOString()}
                        className={"cal_week_col" + (sameDay(day, today) ? " today" : "")}
                    >
                        <div className="cal_week_head">
                            <button className="cal_week_day" onClick={() => onOpenDay(day)}>
                                <span>{day.toLocaleDateString([], { weekday: "short" })}</span>
                                <strong>{day.getDate()}</strong>
                            </button>
                            <button className="cal_add" title="Add event" onClick={() => onAdd(day)}>
                                +
                            </button>
                        </div>
                        <div className="cal_week_events">
                            {list.map((ev) => (
                                <EventChip
                                    key={ev.id}
                                    ev={ev}
                                    showTime
                                    onClick={onEventClick}
                                    onContext={onEventContext}
                                />
                            ))}
                            {list.length === 0 && <div className="cal_none">—</div>}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function DayView({ date, events, onAdd, onEventClick, onEventContext }: ViewProps){
    const list = eventsOnDay(events, date);

    return(
        <div className="cal_day">
            <button className="cal_day_add" onClick={() => onAdd(date)}>+ Add event</button>
            {list.length === 0 && <div className="cal_empty">Nothing planned this day.</div>}
            {list.map((ev) => (
                <div
                    key={ev.id}
                    className="cal_card"
                    style={ev.color ? ({ "--chip-color": ev.color } as CSSProperties) : undefined}
                    onClick={() => onEventClick(ev)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        onEventContext(ev, e.clientX, e.clientY);
                    }}
                >
                    <div className="cal_card_name">{ev.name}</div>
                    <div className="cal_card_time">{rangeLabel(ev)}</div>
                    {ev.person && ev.person.length > 0 && (
                        <div className="cal_card_people">
                            {ev.person.map((p) => p.name).join(", ")}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export { YearView, MonthView, WeekView, DayView }