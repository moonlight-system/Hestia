import { useEffect, useState, type FormEvent } from "react";
import type { Person, Repeat, TaskMode } from "../Types";
import { toDateInput } from "../taskUtils";

export type TaskData = {
    name: string;
    mode: TaskMode;
    assignee?: Person;
    participants: Person[];
    repeat?: Repeat;
    date?: Date;
    time?: string;
    description?: string;
};
export type TaskModalMode = "create" | "edit" | "rename";

type Props = {
    mode: TaskModalMode;
    initial: TaskData;
    members: Person[];
    onSave: (data: TaskData) => Promise<void>;
    onClose: () => void;
};

const TITLES: Record<TaskModalMode, string> = {
    create: "New task",
    edit: "Edit task",
    rename: "Rename task",
};

const WHO: { id: TaskMode; label: string; hint: string }[] = [
    { id: "anyone", label: "Anyone", hint: "One checkbox that any roommate can tick." },
    { id: "assigned", label: "One person", hint: "One checkbox that only the chosen roommate can tick." },
    { id: "each", label: "Each person", hint: "One checkbox per selected roommate. Everyone ticks their own." },
];

function TaskModal({ mode, initial, members, onSave, onClose }: Props){
    const [name, setName] = useState(initial.name);
    const [who, setWho] = useState<TaskMode>(initial.mode);
    const [assigneeId, setAssigneeId] = useState(initial.assignee?.id ?? "");
    const [selected, setSelected] = useState<string[]>(initial.participants.map((p) => p.id));
    const [repeats, setRepeats] = useState(!!initial.repeat);
    const [every, setEvery] = useState(String(initial.repeat?.every ?? 1));
    const [unit, setUnit] = useState<Repeat["unit"]>(initial.repeat?.unit ?? "weeks");
    const [date, setDate] = useState(initial.date ? toDateInput(initial.date) : "");
    const [time, setTime] = useState(initial.time ?? "");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [description, setDescription] = useState(initial.description ?? "");

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

        const n = Math.floor(Number(every));
        if (mode !== "rename") {
            if (who === "assigned" && !assigneeId) { setError("Pick who is responsible."); return; }
            if (who === "each" && selected.length === 0) { setError("Pick at least one roommate."); return; }
            if (repeats && !(n >= 1)) { setError("Repeat interval must be at least 1."); return; }
        }

        const assignee = members.find((m) => m.id === assigneeId);
        setBusy(true);
        try {
            await onSave({
                name: name.trim(),
                mode: who,
                assignee: who === "assigned" && assignee
                    ? { id: assignee.id, name: assignee.name }
                    : undefined,
                participants: who === "each"
                    ? members.filter((m) => selected.includes(m.id)).map(({ id, name }) => ({ id, name }))
                    : [],
                repeat: repeats ? { every: n, unit } : undefined,
                date: date ? new Date(`${date}T00:00`) : undefined,
                time: date && time ? time : undefined,
                description: description.trim() || undefined,
            });
            // On success the parent closes this modal
        } catch (err) {
            console.error(err);
            setError("Could not save. Try again.");
            setBusy(false);
        }
    }

    return(
        <div
            className="cal_backdrop"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <form className="cal_modal" onSubmit={submit}>
                <h3>{TITLES[mode]}</h3>

                <input
                    autoFocus
                    placeholder="Task name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                {mode !== "rename" && (
                    <>
                        <div className="cal_label">Who completes it</div>
                        <div className="cal_people">
                            {WHO.map((w) => (
                                <button
                                    type="button"
                                    key={w.id}
                                    className={who === w.id ? "chip active" : "chip"}
                                    onClick={() => setWho(w.id)}
                                >
                                    {w.label}
                                </button>
                            ))}
                        </div>
                        <div className="task_hint">{WHO.find((w) => w.id === who)?.hint}</div>

                        {who === "assigned" && (
                            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                                <option value="">Choose a roommate…</option>
                                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        )}

                        {who === "each" && (
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
                        )}

                        <label className="task_check">
                            <input
                                type="checkbox"
                                checked={repeats}
                                onChange={(e) => setRepeats(e.target.checked)}
                            />
                            Repeats
                        </label>

                        {repeats && (
                            <div className="task_repeat_row">
                                Every
                                <input
                                    type="number"
                                    min={1}
                                    value={every}
                                    onChange={(e) => setEvery(e.target.value)}
                                />
                                <select value={unit} onChange={(e) => setUnit(e.target.value as Repeat["unit"])}>
                                    <option value="days">days</option>
                                    <option value="weeks">weeks</option>
                                    <option value="months">months</option>
                                </select>
                            </div>
                        )}

                        <label>
                            {repeats ? "First due date" : "Due date (optional)"}
                            <input
                                type="date"
                                value={date}
                                required={repeats}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </label>

                        {date && (
                            <label>
                                Due time (optional)
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </label>
                        )}

                        <label>
                            Description (optional)
                            <textarea
                                rows={3}
                                placeholder="Instructions, details, anything useful…"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </label>
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

export { TaskModal }