import "./Calendar.css";
import { useMemo, useRef, useState } from "react";
import { PagedView, type PagerHandle } from "./PagedView";
import {
    addDoc, collection, deleteDoc, deleteField, doc, Timestamp, updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useHouseholdId } from "../HouseholdContext";
import { useMembers } from "../useMembers";
import { useEvents } from "../useEvents";
import { addDays, addMonths, startOfDay, startOfWeek } from "../calendarUtils";
import { YearView, MonthView, WeekView, DayView, type ViewProps } from "./CalendarViews";
import { EventModal, type EventData, type ModalMode } from "./EventModal";
import { ContextMenu } from "./ContextMenu";
import type { Event } from "../Types";

type View = "year" | "month" | "week" | "day";
const VIEWS: View[] = ["year", "month", "week", "day"];

type ModalState = { mode: ModalMode; id?: string; initial: EventData };
type MenuState = { x: number; y: number; ev: Event };

function titleFor(view: View, date: Date): string {
    switch (view) {
        case "year":
            return String(date.getFullYear());
        case "month":
            return date.toLocaleDateString([], { month: "long", year: "numeric" });
        case "week": {
            const s = startOfWeek(date);
            const e = addDays(s, 6);
            const f = (d: Date) => d.toLocaleDateString([], { day: "numeric", month: "short" });
            return `${f(s)} – ${f(e)}, ${e.getFullYear()}`;
        }
        case "day":
            return date.toLocaleDateString([], {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
            });
    }
}

function Calendar(){
    const hid = useHouseholdId();
    const members = useMembers();

    const [view, setView] = useState<View>("month");
    const [date, setDate] = useState<Date>(startOfDay(new Date()));
    const [modal, setModal] = useState<ModalState | null>(null);
    const [menu, setMenu] = useState<MenuState | null>(null);

    const events = useEvents(date.getFullYear());

    // An event with exactly one participant takes that person's colour
    const coloredEvents = useMemo(
        () => events.map((ev) => {
            const only = ev.person?.length === 1 ? ev.person[0].id : null;
            return { ...ev, color: only ? members.find((m) => m.id === only)?.color : undefined };
        }),
        [events, members],
    );

    const pagerRef = useRef<PagerHandle>(null);

    function move(n: number){
        // Month and week views slide; the others jump as before
        if ((view === "month" || view === "week") && pagerRef.current) {
            pagerRef.current.go(n > 0 ? 1 : -1);
            return;
        }
        setDate((d) =>
            view === "year" ? addMonths(d, 12 * n)
            : view === "month" ? addMonths(d, n)
            : view === "week" ? addDays(d, 7 * n)
            : addDays(d, n));
    }

    function openCreate(day: Date){
        const start = new Date(day);
        start.setHours(9, 0, 0, 0);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        setModal({ mode: "create", initial: { name: "", start, end, person: [] } });
    }

    function openEdit(ev: Event, mode: ModalMode = "edit"){
        setModal({
            mode,
            id: ev.id,
            initial: { name: ev.name, start: ev.start, end: ev.end, person: ev.person ?? [] },
        });
    }

    async function save(data: EventData){
        if (!modal) return;
        const col = collection(db, "households", hid, "events");
        const name = data.name.trim();

        if (modal.id && modal.mode === "rename") {
            await updateDoc(doc(col, modal.id), { name });
        } else if (modal.id) {
            await updateDoc(doc(col, modal.id), {
                name,
                start: Timestamp.fromDate(data.start),
                // deleteField removes a previously set end date
                end: data.end ? Timestamp.fromDate(data.end) : deleteField(),
                person: data.person,
            });
        } else {
            await addDoc(col, {
                name,
                start: Timestamp.fromDate(data.start),
                person: data.person,
                // Firestore rejects `undefined`, so only include end when set
                ...(data.end ? { end: Timestamp.fromDate(data.end) } : {}),
            });
        }
        setModal(null);
    }

    async function remove(ev: Event){
        await deleteDoc(doc(db, "households", hid, "events", ev.id));
    }

    const viewProps: ViewProps = {
        date,
        events: coloredEvents,
        onAdd: openCreate,
        onOpenDay: (day) => { setDate(startOfDay(day)); setView("day"); },
        onOpenMonth: (day) => { setDate(startOfDay(day)); setView("month"); },
        onEventClick: (ev) => openEdit(ev),
        onEventContext: (ev, x, y) => setMenu({ x, y, ev }),
    };

    return(
        <div className="calendar_container">
            <div className="cal_toolbar">
                <div className="cal_nav">
                    <button onClick={() => move(-1)}>‹</button>
                    <button onClick={() => setDate(startOfDay(new Date()))}>Today</button>
                    <button onClick={() => move(1)}>›</button>
                </div>

                <h2 className="cal_title">{titleFor(view, date)}</h2>

                <div className="cal_views">
                    {VIEWS.map((v) => (
                        <button
                            key={v}
                            className={v === view ? "cal_view_btn active" : "cal_view_btn"}
                            onClick={() => setView(v)}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            <div className="cal_body">
                {view === "year" && <YearView {...viewProps} />}
                {view === "month" && (
                    <PagedView
                        ref={pagerRef}
                        axis="y"
                        date={date}
                        step={addMonths}
                        onChange={setDate}
                        render={(d) => <MonthView {...viewProps} date={d} />}
                    />
                )}
                {view === "week" && (
                    <PagedView
                        ref={pagerRef}
                        axis="x"
                        date={date}
                        step={(d, n) => addDays(d, 7 * n)}
                        onChange={setDate}
                        render={(d) => <WeekView {...viewProps} date={d} />}
                    />
                )}
                {view === "day" && <DayView {...viewProps} />}
            </div>

            {modal && (
                <EventModal
                    mode={modal.mode}
                    initial={modal.initial}
                    members={members}
                    onSave={save}
                    onClose={() => setModal(null)}
                />
            )}

            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    onClose={() => setMenu(null)}
                    onEdit={() => openEdit(menu.ev)}
                    onRename={() => openEdit(menu.ev, "rename")}
                    onDelete={() => remove(menu.ev)}
                />
            )}
        </div>
    )
}

export { Calendar }