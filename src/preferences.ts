import { DEFAULT_THEME, THEME_PRESETS, luminance, withOverrides } from "./themes";

export type Prefs = {
    theme: string;
    font: string;
    size: string;
    overrides: Record<string, Record<string, string>>;   // theme name -> { css variable -> colour }
};

export const FONTS = [
    // Monospace is first on purpose: it is the default, and also the fallback
    // for anyone whose saved preference is the old "default" id.
    { id: "mono", label: "Monospace", stack: '"Cascadia Code", Consolas, Menlo, monospace' },
    { id: "system", label: "System", stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
    { id: "opendyslexic", label: "OpenDyslexic", stack: '"OpenDyslexic", sans-serif' },
    { id: "atkinson", label: "Atkinson Hyperlegible", stack: '"Atkinson Hyperlegible", sans-serif' },
    { id: "lexend", label: "Lexend", stack: '"Lexend", sans-serif' },
    { id: "inter", label: "Inter", stack: '"Inter", sans-serif' },
    { id: "nunito", label: "Nunito", stack: '"Nunito", sans-serif' },
    { id: "spacegrotesk", label: "Space Grotesk", stack: '"Space Grotesk", sans-serif' },
    { id: "humanist", label: "Humanist", stack: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif' },
    { id: "serif", label: "Serif", stack: 'Georgia, "Times New Roman", serif' },
    { id: "merriweather", label: "Merriweather", stack: '"Merriweather", serif' },
    { id: "lora", label: "Lora", stack: '"Lora", serif' },
    { id: "jetbrains", label: "JetBrains Mono", stack: '"JetBrains Mono", monospace' },
    { id: "firacode", label: "Fira Code", stack: '"Fira Code", monospace' },
    { id: "caveat", label: "Caveat (handwritten)", stack: '"Caveat", cursive' },
];

export const SIZES = [
    { id: "small", label: "Small", px: 14 },
    { id: "normal", label: "Normal", px: 16 },
    { id: "large", label: "Large", px: 18 },
];

const KEY = "hestia-prefs";
const DEFAULTS: Prefs = { theme: DEFAULT_THEME, font: "mono", size: "normal", overrides: {} };

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
    const colors = withOverrides(theme.colors, p.overrides?.[theme.name]);
    for (const [name, value] of Object.entries(colors)) {
        root.style.setProperty(name, value);
    }
    // Dark or light is judged from the actual background, since the user may have changed it
    root.style.colorScheme = luminance(colors["--base-bg-color"]) < 0.4 ? "dark" : "light";

    const font = FONTS.find((f) => f.id === p.font) ?? FONTS[0];
    if (font.stack) root.style.setProperty("--app-font", font.stack);
    else root.style.removeProperty("--app-font");

    const size = SIZES.find((s) => s.id === p.size) ?? SIZES[1];
    // Phones have a narrow viewport, so everything (all rem-based) is scaled down.
    // Tweak MOBILE_SCALE to taste: smaller = more compact.
    const MOBILE_SCALE = 0.8;
    const scale = root.dataset.platform === "mobile" ? MOBILE_SCALE : 1;
    root.style.fontSize = `${size.px * scale}px`;
}