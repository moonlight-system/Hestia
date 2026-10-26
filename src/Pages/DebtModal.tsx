import { useEffect, useState, type FormEvent } from "react";
import type { Person } from "../Types";

export type DebtForm = {
    debtorId: string;
    creditorId: string;
    kind: "money" | "text";
    cents?: number;
    what?: string;
    description?: string;
};
export type DebtModalMode = "create" | "edit";

type Props = {
    mode: DebtModalMode;
    initial: DebtForm;
    members: Person[];
    onSave: (data: DebtForm) => Promise<void>;
    onClose: () => void;
};

function DebtModal({ mode, initial, members, onSave, onClose }: Props){
    const [debtorId, setDebtorId] = useState(initial.debtorId);
    const [creditorId, setCreditorId] = useState(initial.creditorId);
    const [kind, setKind] = useState(initial.kind);
    const [amount, setAmount] = useState(initial.cents ? (initial.cents / 100).toFixed(2) : "");
    const [what, setWhat] = useState(initial.what ?? "");
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

        if (!debtorId || !creditorId || debtorId === creditorId) {
            setError("Pick two different roommates.");
            return;
        }
        const cents = Math.round(Number(amount) * 100);
        if (kind === "money" && !(cents >= 1)) {
            setError("Enter an amount greater than zero.");
            return;
        }
        if (kind === "text" && !what.trim()) {
            setError("Say what is owed.");
            return;
        }

        setBusy(true);
        try {
            await onSave({
                debtorId,
                creditorId,
                kind,
                cents: kind === "money" ? cents : undefined,
                what: kind === "text" ? what.trim() : undefined,
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
                <h3>{mode === "create" ? "New debt" : "Edit debt"}</h3>

                <div className="debt_pair_row">
                    <select value={debtorId} onChange={(e) => setDebtorId(e.target.value)}>
                        <option value="">Who owes…</option>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <span>owes</span>
                    <select value={creditorId} onChange={(e) => setCreditorId(e.target.value)}>
                        <option value="">To whom…</option>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>

                <div className="cal_people">
                    <button
                        type="button"
                        className={kind === "money" ? "chip active" : "chip"}
                        onClick={() => setKind("money")}
                    >
                        Money
                    </button>
                    <button
                        type="button"
                        className={kind === "text" ? "chip active" : "chip"}
                        onClick={() => setKind("text")}
                    >
                        Something else
                    </button>
                </div>

                {kind === "money" ? (
                    <label>
                        Amount (€)
                        <input
                            autoFocus
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </label>
                ) : (
                    <label>
                        What is owed
                        <input
                            autoFocus
                            placeholder="e.g. 2 cans of Monster"
                            value={what}
                            onChange={(e) => setWhat(e.target.value)}
                        />
                    </label>
                )}

                <label>
                    Description (optional)
                    <textarea
                        rows={3}
                        placeholder="What it was for, details…"
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

export { DebtModal }