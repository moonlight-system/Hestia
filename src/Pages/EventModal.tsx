import { useEffect, useState, type FormEvent } from "react";
import type { EventRepeat, EventUnit, Person } from "../Types";
import { toInputValue } from "../calendarUtils";

export type EventData = { name: string; start: Date; end?: Date; person: Person[]; repeat?: EventRepeat };
export type ModalMode = "create" | "edit" | "rename";

type Props = {
    mode: ModalMode;
    initial: EventData;
    members: Person[];
    onSave: (data: EventData) => Promise<void>;
    onClose: () => void;
};

const TITLES: Record<ModalMode, string> = {
    create: "New event",
    edit: "Edit event",
    rename: "Rename event",
};

function EventModal({ mode, initial, members, onSave, onClose }: Props){
    const [name, setName] = useState(initial.name);
    const [start, setStart] = useState(toInputValue(initial.start));
    const [end, setEnd] = useState(initial.end ? toInputValue(initial.end) : "");
    const [selected, setSelected] = useState<string[]>(initial.person.map((p) => p.id));
    const r = initial.repeat;
    const [kind, setKind] = useState<"none" | "interval" | "monthday">(
        !r ? "none" : "monthDay" in r ? "monthday" : "interval",
    );
    const [every, setEvery] = useState(String(r && "every" in r ? r.every : 1));
    const [unit, setUnit] = useState<EventUnit>(r && "unit" in r ? r.unit : "weeks");
    const [monthDay, setMonthDay] = useState(
        String(r && "monthDay" in r ? r.monthDay : initial.start.getDate()),
    );
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    function toggle(id: string){
        setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
    }

    async function submit(e: FormEvent){
        e.preventDefault();
        setError("");
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : undefined;
        if (mode !== "rename" && endDate && endDate < startDate) {
            setError("The end can't be before the start.");
            return;
        }
        const n = Math.floor(Number(every));
        const day = Math.floor(Number(monthDay));
        if (mode !== "rename") {
            if (kind === "interval" && !(n >= 1)) {
                setError("The repeat interval must be at least 1.");
                return;
            }
            if (kind === "monthday" && !(day >= 1 && day <= 31)) {
                setError("Pick a day of the month between 1 and 31.");
                return;
            }
        }
        setBusy(true);
        try {
            await onSave({
                name: name.trim(),
                start: startDate,
                end: endDate,
                person: members
                    .filter((m) => selected.includes(m.id))
                    .map(({ id, name }) => ({ id, name })),
                repeat: kind === "interval" ? { every: n, unit }
                    : kind === "monthday" ? { monthDay: day }
                    : undefined,
            });
            // On success the parent closes this modal
        } catch (err) {
            console.error(err);
            setError("Could not save. Try again.");
            setBusy(false);
        }
    }

    return(
        // mouseDown (not click) so dragging to select text doesn't close the modal
        <div
            className="cal_backdrop"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <form className="cal_modal" onSubmit={submit}>
                <h3>{TITLES[mode]}</h3>

                <input
                    autoFocus
                    placeholder="Event name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                {mode !== "rename" && (
                    <>
                        <label>
                            Starts
                            <input
                                type="datetime-local"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Ends (optional)
                            <input
                                type="datetime-local"
                                value={end}
                                min={start}
                                onChange={(e) => setEnd(e.target.value)}
                            />
                        </label>
                        <div className="cal_label">Repeat</div>
                        <div className="cal_people">
                            <button
                                type="button"
                                className={kind === "none" ? "chip active" : "chip"}
                                onClick={() => setKind("none")}
                            >Never</button>
                            <button
                                type="button"
                                className={kind === "interval" ? "chip active" : "chip"}
                                onClick={() => setKind("interval")}
                            >Every…</button>
                            <button
                                type="button"
                                className={kind === "monthday" ? "chip active" : "chip"}
                                onClick={() => setKind("monthday")}
                            >Day of month</button>
                        </div>

                        {kind === "interval" && (
                            <div className="task_repeat_row">
                                Every
                                <input
                                    type="number"
                                    min={1}
                                    value={every}
                                    onChange={(e) => setEvery(e.target.value)}
                                />
                                <select value={unit} onChange={(e) => setUnit(e.target.value as EventUnit)}>
                                    <option value="days">days</option>
                                    <option value="weeks">weeks</option>
                                    <option value="months">months</option>
                                    <option value="years">years</option>
                                </select>
                            </div>
                        )}

                        {kind === "monthday" && (
                            <>
                                <div className="task_repeat_row">
                                    On day
                                    <input
                                        type="number"
                                        min={1}
                                        max={31}
                                        value={monthDay}
                                        onChange={(e) => setMonthDay(e.target.value)}
                                    />
                                    of every month
                                </div>
                                <div className="task_hint">
                                    Starts at the first such day on or after the start date. Short months use their last day.
                                </div>
                            </>
                        )}
                        {kind !== "none" && (
                            <div className="task_hint">Editing or deleting applies to the whole series.</div>
                        )}
                        <div className="cal_label">Who's involved</div>
                        <div className="cal_people">
                            {members.map((m) => (
                                <button
                                    type="button"
                                    key={m.id}
                                    className={selected.includes(m.id) ? "chip active" : "chip"}
                                    onClick={() => toggle(m.id)}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {error && <div className="cal_error">{error}</div>}

                <div className="cal_modal_actions">
                    <button type="button" className="cal_cancel" onClick={onClose}>Cancel</button>
                    <button type="submit" className="cal_save" disabled={busy}>Save</button>
                </div>
            </form>
        </div>
    )
}

export { EventModal }