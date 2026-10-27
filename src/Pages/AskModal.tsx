import { useEffect, useState, type FormEvent } from "react";

export type AskData = { content: string; vote: boolean; text: boolean };

type Props = {
    onSave: (data: AskData) => Promise<void>;
    onClose: () => void;
};

function AskModal({ onSave, onClose }: Props){
    const [content, setContent] = useState("");
    const [vote, setVote] = useState(true);
    const [text, setText] = useState(false);
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
        if (!vote && !text) { setError("Pick at least one way to answer."); return; }
        setBusy(true);
        try {
            await onSave({ content: content.trim(), vote, text });
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
                <h3>New ask</h3>

                <textarea
                    autoFocus
                    rows={3}
                    placeholder="Can I bring people over on Monday?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                />

                <div className="cal_label">How can roommates answer?</div>
                <div className="cal_people">
                    <button
                        type="button"
                        className={vote ? "chip active" : "chip"}
                        onClick={() => setVote((v) => !v)}
                    >
                        ✓ / ✗
                    </button>
                    <button
                        type="button"
                        className={text ? "chip active" : "chip"}
                        onClick={() => setText((t) => !t)}
                    >
                        Text
                    </button>
                </div>
                <div className="task_hint">If you pick both, each roommate gives both.</div>

                {error && <div className="cal_error">{error}</div>}

                <div className="cal_modal_actions">
                    <button type="button" className="cal_cancel" onClick={onClose}>Cancel</button>
                    <button type="submit" className="cal_save" disabled={busy}>Post</button>
                </div>
            </form>
        </div>
    )
}

export { AskModal }