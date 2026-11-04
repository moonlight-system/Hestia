import { useEffect, useState, type FormEvent } from "react";
import type { Person } from "../Types";
import { t } from "../i18n";

export type GroceryData = { name: string; forId?: string };

type Props = {
    initial: GroceryData;
    members: Person[];
    onSave: (data: GroceryData) => Promise<void>;
    onClose: () => void;
};

function GroceryModal({ initial, members, onSave, onClose }: Props){
    const [name, setName] = useState(initial.name);
    const [forId, setForId] = useState(initial.forId ?? "");
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
            await onSave({ name: name.trim(), forId: forId || undefined });
        } catch (err) {
            console.error(err);
            setError(t("Could not save. Try again."));
            setBusy(false);
        }
    }

    return(
        <div
            className="cal_backdrop"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <form className="cal_modal" onSubmit={submit}>
                <h3>{t("Edit item")}</h3>

                <input
                    autoFocus
                    placeholder={t("Item name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <label>
                    {t("For")}
                    <select value={forId} onChange={(e) => setForId(e.target.value)}>
                        <option value="">{t("Everyone")}</option>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </label>

                {error && <div className="cal_error">{error}</div>}

                <div className="cal_modal_actions">
                    <button type="button" className="cal_cancel" onClick={onClose}>{t("Cancel")}</button>
                    <button type="submit" className="cal_save" disabled={busy}>{t("Save")}</button>
                </div>
            </form>
        </div>
    )
}

export { GroceryModal }