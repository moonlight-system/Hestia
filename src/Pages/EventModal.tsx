import { useEffect, useState, type FormEvent } from "react";
import type { Person } from "../Types";
import { toInputValue } from "../calendarUtils";

export type EventData = { name: string; start: Date; end?: Date; person: Person[] };
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
        setBusy(true);
        try {
            await onSave({
                name: name.trim(),
                start: startDate,
                end: endDate,
                person: members
                    .filter((m) => selected.includes(m.id))
                    .map(({ id, name }) => ({ id, name })),
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