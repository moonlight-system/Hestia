import { DEFAULT_THEME, THEME_PRESETS } from "./themes";

export type Prefs = { theme: string; font: string; size: string };

export const FONTS = [
    { id: "default", label: "Default", stack: "" },
    { id: "system", label: "System", stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
    { id: "serif", label: "Serif", stack: 'Georgia, "Times New Roman", serif' },
    { id: "mono", label: "Monospace", stack: '"Cascadia Code", Consolas, Menlo, monospace' },
    { id: "humanist", label: "Humanist", stack: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif' },
];

export const SIZES = [
    { id: "small", label: "Small", px: 14 },
    { id: "normal", label: "Normal", px: 16 },
    { id: "large", label: "Large", px: 18 },
];

const KEY = "hestia-prefs";
const DEFAULTS: Prefs = { theme: DEFAULT_THEME, font: "default", size: "normal" };

export function loadPrefs(): Prefs {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
        return DEFAULTS;
    }
}

export function savePrefs(p: Prefs) {
    try {
        localStorage.setItem(KEY, JSON.stringify(p));
    } catch {
        // storage unavailable: the choice just won't survive a restart
    }
}

export function applyPrefs(p: Prefs) {
    const root = document.documentElement;

    const theme = THEME_PRESETS.find((t) => t.name === p.theme) ?? THEME_PRESETS[0];
    for (const [name, value] of Object.entries(theme.colors)) {
        root.style.setProperty(name, value);
    }
    root.style.setProperty("--danger-color", theme.dark ? "var(--danger-color)" : "#c92a2a");
    // Tells the browser to draw native things (date pickers, scrollbars) dark or light
    root.style.colorScheme = theme.dark ? "dark" : "light";

    const font = FONTS.find((f) => f.id === p.font) ?? FONTS[0];
    if (font.stack) root.style.setProperty("--app-font", font.stack);
    else root.style.removeProperty("--app-font");

    const size = SIZES.find((s) => s.id === p.size) ?? SIZES[1];
    root.style.fontSize = `${size.px}px`;
}