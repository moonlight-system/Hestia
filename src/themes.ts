export type ThemePreset = {
    name: string;
    dark?: boolean;
    colors: Record<string, string>;
};

function luminance(hex: string): number {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const [r, g, b] = [0, 2, 4]
        .map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Black or white text, whichever contrasts best on a given colour
function onColor(hex: string): string {
    return luminance(hex) > 0.179 ? "#141414" : "#ffffff";
}

// Everything except accent, bg and text is optional and has a sensible default
type Palette = {
    accent: string;                    // buttons, active states, "+" buttons
    bg: [string, string, string];      // [base, darker, darkest]
    text: string;
    accentText?: string;               // accent used AS TEXT (must contrast with the bgs)
    title?: string;                    // headings; defaults to accentText
    secondary?: string;                // event times, debt amounts; defaults to accentText
    danger?: string;
    onAccent?: string;                 // text on the accent; auto black/white if omitted
    add?: string;                      // "+" button background; defaults to accent
    viewBtn?: string;                  // toolbar button background; defaults to darker bg
    viewActive?: string;               // active Year/Month/Week/Day; defaults to accent
    cell?: string;                     // calendar cell background; defaults to darkest bg
    cellOther?: string;                // days outside the current month
    cellBorder?: string;               // grid lines; defaults to base bg
    today?: string;                    // "today" highlight; defaults to accent
};

function buildPreset(p: Palette, dark: boolean): Record<string, string> {
    const onAccent = p.onAccent ?? onColor(p.accent);
    // Text colour for a custom background, or the accent's text colour if none given
    const on = (bg?: string) => (bg ? onColor(bg) : onAccent);
    const accentText = p.accentText ?? p.accent;

    return {
        "--main-accent-color": p.accent,
        "--accent-text-color": accentText,
        "--base-bg-color": p.bg[0],
        "--darker-bg-color": p.bg[1],
        "--darkest-bg-color": p.bg[2],
        "--text-color": p.text,
        "--muted-color": "color-mix(in srgb, var(--text-color) 62%, var(--base-bg-color))",
        "--on-accent-color": onAccent,
        "--danger-color": p.danger ?? (dark ? "#ff6b6b" : "#c92a2a"),

        "--title-accent-color": p.title ?? accentText,
        "--secondary-accent-color": p.secondary ?? accentText,

        "--add-bg-color": p.add ?? p.accent,
        "--add-text-color": on(p.add),

        "--view-btn-bg-color": p.viewBtn ?? "var(--darker-bg-color)",
        "--view-btn-text-color": "var(--text-color)",
        "--view-btn-active-bg-color": p.viewActive ?? p.accent,
        "--view-btn-active-text-color": on(p.viewActive),

        "--cell-bg-color": p.cell ?? "var(--darkest-bg-color)",
        "--cell-other-bg-color":
            p.cellOther ?? "color-mix(in srgb, var(--cell-bg-color) 55%, var(--base-bg-color))",
        "--cell-border-color": p.cellBorder ?? "var(--base-bg-color)",
        "--today-color": p.today ?? p.accent,
        "--today-text-color": on(p.today),
    };
}

function theme(name: string, p: Palette): ThemePreset {
    const dark = luminance(p.bg[0]) < 0.4;   // dark/light is detected from the base background
    return { name, dark, colors: buildPreset(p, dark) };
}

export const DEFAULT_THEME = "Hestia";

const DARK_THEMES: ThemePreset[] = [
    theme("Hestia", {
        accent: "#eb0047", accentText: "#ff4d7d", onAccent: "#ffffff",
        bg: ["#312e2e", "#201e1e", "#131212"], text: "#ffffff",
    }),
    theme("Bragi", {
        accent: "#00ff9d",
        bg: ["#25252b", "#1c1c20", "#141418"], text: "#ffffff",
    }),
    theme("Midnight", {
        accent: "#5c7aff", accentText: "#8aa0ff",
        bg: ["#1b1f33", "#151827", "#0f1220"], text: "#ffffff",
    }),
    theme("Sunset", {
        accent: "#ff9f50", title: "#ff5a5a", secondary: "#ffd45f",
        bg: ["#2a1f26", "#221a20", "#1a1418"], text: "#ffffff",
    }),
    theme("Espresso", {
        accent: "#d9a066", title: "#f2d3a4", secondary: "#c8864a",
        bg: ["#2b1f19", "#231915", "#1a110e"], text: "#efe3d0",
    }),
    theme("Red Velvet", {
        accent: "#e5383b", accentText: "#ff5a5f", secondary: "#ff9396",
        bg: ["#1a0b0d", "#130709", "#0c0405"], text: "#f2e6e6",
    }),
    theme("Adrien", {
        accent: "#910000", accentText: "#e04646", onAccent: "#ffffff",
        today: "#d63a3a",
        bg: ["#1a1a1a", "#121212", "#070707"], text: "#f2e6e6",
    }),
    theme("Forest", {
        accent: "#34c17b", title: "#b9e4a3", secondary: "#7ddf64",
        bg: ["#16251c", "#101c15", "#0b130e"], text: "#e6f2e4",
    }),
    theme("Synthwave", {
        accent: "#ff3cac", title: "#2de2e6", secondary: "#2de2e6",
        bg: ["#241734", "#1b1027", "#130a1c"], text: "#f3e9ff",
    }),
    theme("Graphite", {
        accent: "#f5f5f5", title: "#ffffff", secondary: "#d0d0d0",
        bg: ["#262626", "#1c1c1c", "#121212"], text: "#c4c4c4",
    }),
    theme("Amethyst", {
        accent: "#b794f6", title: "#d6bcfa", secondary: "#a98af0",
        bg: ["#231a33", "#1a1327", "#120c1c"], text: "#e9e1f5",
    }),
    theme("Ocean", {
        accent: "#ff8a75", title: "#ffb199", secondary: "#4fd1c5",
        bg: ["#0f2a33", "#0b2028", "#07161c"], text: "#e0f2f1",
    }),
    theme("Amber", {
        accent: "#ffcc4d", secondary: "#ffa726",
        bg: ["#17120b", "#110d08", "#0b0805"], text: "#cf9b3e",
    }),
    theme("Black Pink", {
        accent: "#f038e7", accentText: "#f65aee", secondary: "#ffffff",
        bg: ["#382e35", "#281b23", "#180612"], text: "#f5dede",
    }),
];

const LIGHT_THEMES: ThemePreset[] = [
    theme("Angel", {
        accent: "#009baf", accentText: "#006f81", secondary: "#00697a",
        bg: ["#f4f2ee", "#dae5e6", "#becccf"], text: "#2b2b2e",
    }),
    theme("Latte", {
        accent: "#a55c2e", accentText: "#8f4a1f", secondary: "#7d5200",
        bg: ["#efe3d0", "#e1d0b8", "#d2bd9f"], text: "#3b2a20",
    }),
    theme("Mango", {
        accent: "#c9341c", accentText: "#a3260f", secondary: "#a63f00",
        bg: ["#fff1d6", "#ffe0b0", "#ffcb91"], text: "#3d1f14",
    }),
    theme("Trans rights !!", {
        accent: "#cf1b6e", accentText: "#b8155f", secondary: "#136a92",
        bg: ["#fbf6f9", "#d9eef8", "#f6d8e3"], text: "#2a1f33",
    }),
    theme("Matcha", {
        accent: "#3f6b2a", title: "#2a4a1a", secondary: "#477529",
        bg: ["#e8efd9", "#d8e3c2", "#c6d4a8"], text: "#25331b",
    }),
    theme("Lilac", {
        accent: "#7048b8", accentText: "#5f3aa3", title: "#4f2f8a", secondary: "#7a52c0",
        bg: ["#f1ecf8", "#e5ddf1", "#d7cbe6"], text: "#2e2640",
    }),
    theme("Vanilla", {
        accent: "#e49400", accentText: "#8f5400", secondary: "#a06000",
        bg: ["#fdf3d8", "#f8e6b8", "#f0d796"], text: "#5c3d0a",
    }),
    theme("Rose Garden", {
        accent: "#c2406a", accentText: "#b0345c", title: "#2f5a3e", secondary: "#35704a",
        bg: ["#f8ecec", "#f0dcdc", "#e6c9cb"], text: "#3b2530",
    }),
];

export const THEME_PRESETS: ThemePreset[] = [...DARK_THEMES, ...LIGHT_THEMES];