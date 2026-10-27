import { useEffect, useState } from "react";

type Props = {
    x: number;
    y: number;
    onClose: () => void;
    onEdit?: () => void;
    onRename?: () => void;
    onDelete: () => void;
};

function ContextMenu({ x, y, onClose, onEdit, onRename, onDelete }: Props){
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    // Keep the menu on screen near the window edges
    const left = Math.min(x, window.innerWidth - 190);
    const top = Math.min(y, window.innerHeight - 140);

    return(
        // The invisible backdrop catches any click outside the menu and closes it
        <div
            className="ctx_backdrop"
            onClick={onClose}
            onContextMenu={(e) => { e.preventDefault(); onClose(); }}
        >
            <div className="ctx_menu" style={{ left, top }} onClick={(e) => e.stopPropagation()}>
                {onEdit && (
                    <button onClick={() => { onEdit(); onClose(); }}>Edit…</button>
                )}
                {onRename && (
                    <button onClick={() => { onRename(); onClose(); }}>Rename</button>
                )}
                {confirming ? (
                    <button className="danger" onClick={() => { onDelete(); onClose(); }}>
                        Click again to delete
                    </button>
                ) : (
                    <button className="danger" onClick={() => setConfirming(true)}>Delete</button>
                )}
            </div>
        </div>
    )
}

export { ContextMenu }