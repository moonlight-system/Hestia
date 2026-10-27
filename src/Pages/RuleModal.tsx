import { useEffect, useState, type FormEvent } from "react";

export type RuleData = { name: string; description?: string };
export type RuleModalMode = "create" | "edit";

type Props = {
    mode: RuleModalMode;
    initial: RuleData;
    onSave: (data: RuleData) => Promise<void>;
    onClose: () => void;
};

function RuleModal({ mode, initial, onSave, onClose }: Props){
    const [name, setName] = useState(initial.name);
    const [description, setDescription] = useState(initial.description ?? "");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    async function submit(e: FormEvent){
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            await onSave({
                name: name.trim(),
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
                <h3>{mode === "create" ? "New rule" : "Edit rule"}</h3>

                <input
                    autoFocus
                    placeholder="Rule title"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <label>
                    Description (optional)
                    <textarea
                        rows={3}
                        placeholder="Details, exceptions, anything useful…"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </label>

                {error && <div className="cal_error">{error}</div>}

                <div className="cal_modal_actions">
                    <button type="button" className="cal_cancel" onClick={onClose}>Cancel</button>
                    <button type="submit" className="cal_save" disabled={busy}>Save</button>
                </div>
            </form>
        </div>
    )
}

export { RuleModal }