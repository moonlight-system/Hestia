import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type DropdownOption = {
    id: string;
    label: string;
    style?: CSSProperties;   // applied to this option's row, and to the button when selected
    extra?: ReactNode;       // shown on the right of the row
};

type Props = {
    value: string;
    options: DropdownOption[];
    onChange: (id: string) => void;
};

function Dropdown({ value, options, onChange }: Props){
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const current = options.find((o) => o.id === value) ?? options[0];

    // Close on outside click or Escape
    useEffect(() => {
        if (!open) return;
        const onDown = (e: PointerEvent) => {
            if (!root.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("pointerdown", onDown);
        window.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onDown);
            window.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return(
        <div className="theme_picker" ref={root}>
            <button
                type="button"
                className="settings_input theme_picker_btn"
                style={current.style}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
            >
                <span>{current.label}</span>
                <span>▾</span>
            </button>

            {open && (
                <div className="theme_picker_list" role="listbox">
                    {options.map((o) => (
                        <button
                            type="button"
                            role="option"
                            aria-selected={o.id === current.id}
                            key={o.id}
                            className={o.id === current.id ? "theme_option selected" : "theme_option"}
                            style={o.style}
                            onClick={() => { onChange(o.id); setOpen(false); }}
                        >
                            <span>{o.label}</span>
                            {o.extra}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export { Dropdown }