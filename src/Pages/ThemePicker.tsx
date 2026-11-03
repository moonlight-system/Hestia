import { EDITABLE_COLORS, THEME_PRESETS, resolveColor, type ThemePreset } from "../themes";
import { Dropdown } from "./Dropdown";
import { locale, t } from "../i18n";

type Props = { value: string; onChange: (name: string) => void };

function Mini({ theme }: { theme: ThemePreset }){
    return(
        <span className="theme_mini">
            {EDITABLE_COLORS.map((c) => (
                <span key={c.key} style={{ backgroundColor: resolveColor(theme.colors, c.key) }} />
            ))}
        </span>
    )
}

function ThemePicker({ value, onChange }: Props){
    const options = THEME_PRESETS.map((p) => ({
        id: p.name,
        label: p.name + (p.dark ? "" : ` (${t("light")})`),
        extra: <Mini theme={p} />,
    }));
    return <Dropdown value={value} options={options} onChange={onChange} />
}

export { ThemePicker }