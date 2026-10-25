export type ThemePreset = {
    name: string;
    dark?: boolean;
    colors: Record<string, string>;
};

// Picks black or white text for the best contrast on a given accent colour
function onColor(hex: string): string {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const [r, g, b] = [0, 2, 4]
        .map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.179 ? "#141414" : "#ffffff";
}

function buildPreset(
    accent: string,
    bgs: [string, string, string],   // [base, darker, darkest]
    text: string,
    overrides: Record<string, string> = {},
): Record<string, string> {
    return {
        "--main-accent-color": accent,
        "--base-bg-color": bgs[0],
        "--darker-bg-color": bgs[1],
        "--darkest-bg-color": bgs[2],
        "--text-color": text,
        "--muted-color": "color-mix(in srgb, var(--text-color) 62%, var(--base-bg-color))",
        "--on-accent-color": onColor(accent),

        // Accents for titles, and for event times
        "--title-accent-color": "var(--main-accent-color)",
        "--secondary-accent-color": "var(--main-accent-color)",

        // The little "+" buttons
        "--add-bg-color": "var(--main-accent-color)",
        "--add-text-color": "var(--on-accent-color)",

        // Calendar toolbar buttons: Year / Month / Week / Day and ‹ Today ›
        "--view-btn-bg-color": "var(--darker-bg-color)",
        "--view-btn-text-color": "var(--text-color)",
        "--view-btn-active-bg-color": "var(--main-accent-color)",
        "--view-btn-active-text-color": "var(--on-accent-color)",

        // Calendar cells (month cells, week columns, year mini-months)
        "--cell-bg-color": "var(--darkest-bg-color)",
        "--cell-other-bg-color": "color-mix(in srgb, var(--darkest-bg-color) 55%, var(--base-bg-color))",
        "--cell-border-color": "var(--base-bg-color)",
        "--today-color": "var(--main-accent-color)",
        "--today-text-color": "var(--on-accent-color)",

        // Anything a preset passes in wins over the defaults above
        ...overrides,
    };
}

export const DEFAULT_THEME = "Hestia";

export const THEME_PRESETS: ThemePreset[] = [
    {
        name: "Hestia",
        dark: true,
        colors: buildPreset("#eb0047", ["#312e2e", "#201e1e", "#131212"], "#ffffff", {
            "--on-accent-color": "#ffffff",
        }),
    },
    { 
        name: "Bragi", 
        dark: true,
        colors: buildPreset("#00ff9d", ["#25252B", "#1c1c20", "#141418"], "#ffffff") 
    },
    { 
        name: "Midnight", 
        dark: true,
        colors: buildPreset("#5c7aff", ["#1b1f33", "#151827", "#0f1220"], "#ffffff") 
    },
    {
        name: "Sunset",
        dark: true,
        colors: buildPreset("#ff9f50", ["#2a1f26", "#221a20", "#1a1418"], "#ffffff", {
            "--title-accent-color": "#ff4848",
            "--secondary-accent-color": "#ffd45f",
        }),
    },
    {
        name: "Espresso",
        dark: true,
        colors: buildPreset("#d9a066", ["#2b1f19", "#231915", "#1a110e"], "#efe3d0", {
            "--title-accent-color": "#f2d3a4",
            "--secondary-accent-color": "#c8864a",
        }),
    },
    {
        name: "Red Velvet",
        dark: true,
        colors: buildPreset("#e5383b", ["#1a0b0d", "#130709", "#0c0405"], "#f2e6e6", {
            "--title-accent-color": "#c1121f",
            "--secondary-accent-color": "#ff5a5f",
        }),
    },
    {
        name: "Adrien",
        dark: true,
        colors: buildPreset("#910000", ["#1a1a1a", "#121212", "#070707"], "#f2e6e6",),
    },
    {
        name: "Forest",
        dark: true,
        colors: buildPreset("#34c17b", ["#16251c", "#101c15", "#0b130e"], "#e6f2e4", {
            "--title-accent-color": "#b9e4a3",
            "--secondary-accent-color": "#7ddf64",
        }),
    },
    {
        name: "Synthwave",
        dark: true,
        colors: buildPreset("#ff3cac", ["#241734", "#1b1027", "#130a1c"], "#f3e9ff", {
            "--title-accent-color": "#2de2e6",
            "--secondary-accent-color": "#2de2e6",
        }),
    },
    {
        name: "Graphite",
        dark: true,
        colors: buildPreset("#f5f5f5", ["#262626", "#1c1c1c", "#121212"], "#a8a8a8", {
            "--title-accent-color": "#ffffff",
            "--secondary-accent-color": "#d0d0d0",
        }),
    },
    {
        name: "Amethyst",
        dark: true,
        colors: buildPreset("#b794f6", ["#231a33", "#1a1327", "#120c1c"], "#e9e1f5", {
            "--title-accent-color": "#d6bcfa",
            "--secondary-accent-color": "#9f7aea",
        }),
    },
    {
        name: "Ocean",
        dark: true,
        colors: buildPreset("#ff8a75", ["#0f2a33", "#0b2028", "#07161c"], "#e0f2f1", {
            "--title-accent-color": "#ffb199",
            "--secondary-accent-color": "#4fd1c5",
        }),
    },
    {
        name: "Amber",
        dark: true,
        colors: buildPreset("#ffcc4d", ["#17120b", "#110d08", "#0b0805"], "#a87927", {
            "--secondary-accent-color": "#ffa726",
        }),
    },
    {
        name: "Black Pink",
        dark: true,
        colors: buildPreset("#f038e7", ["hsl(320, 10%, 20%)", "hsl(320, 20%, 13%)", "hsl(320, 60%, 6%)"], "#f5dede", {
            "--title-accent-color": "#f038e7",
            "--secondary-accent-color": "#ffffff",
        }),
    },

    {
        name: "Angel",
        colors: buildPreset("#009baf", ["#f4f2ee", "#dae5e6", "#becccf"], "#2b2b2e", {
            "--title-accent-color": "#009baf",
            "--secondary-accent-color": "#009baf",
        }),
    },
    {
        name: "Latte",
        colors: buildPreset("#a55c2e", ["#efe3d0", "#e1d0b8", "#d2bd9f"], "#3b2a20", {
            "--title-accent-color": "#a55c2e",
            "--secondary-accent-color": "#e6b251",
        }),
    },
    {
        name: "Mango",
        colors: buildPreset("#c9341c", ["#FFF1D6", "#FFE0B0", "#FFCB91"], "#3d1f14", {
            "--title-accent-color": "#a3260f",
            "--secondary-accent-color": "#f26b1d",
        }),
    },
    {
        name: "Trans rights !!",
        colors: buildPreset("#cf1b6e", ["#fbf6f9", "#d9eef8", "#f6d8e3"], "#2a1f33", {
            "--secondary-accent-color": "#2b98ca",
        }),
    },
    {
        name: "Matcha",
        colors: buildPreset("#3f6b2a", ["#e8efd9", "#d8e3c2", "#c6d4a8"], "#25331b", {
            "--title-accent-color": "#2a4a1a",
            "--secondary-accent-color": "#6a994e",
        }),
    },
    {
        name: "Lilac",
        colors: buildPreset("#7048b8", ["#f1ecf8", "#e5ddf1", "#d7cbe6"], "#2e2640", {
            "--title-accent-color": "#4f2f8a",
            "--secondary-accent-color": "#9b7fd4",
        }),
    },
    {
        name: "Vanilla",
        colors: buildPreset("#e49400", ["#fdf3d8", "#f8e6b8", "#f0d796"], "#5c3d0a", {
            "--title-accent-color": "#e49400",
            "--secondary-accent-color": "#ffc400",
        }),
    },
    {
        name: "Rose Garden",
        colors: buildPreset("#c2406a", ["#f8ecec", "#f0dcdc", "#e6c9cb"], "#3b2530", {
            "--title-accent-color": "#3f6b4d",
            "--secondary-accent-color": "#6f9c78",
        }),
    },
];