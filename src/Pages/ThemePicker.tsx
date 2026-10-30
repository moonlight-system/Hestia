import { EDITABLE_COLORS, THEME_PRESETS, resolveColor, type ThemePreset } from "../themes";
import { Dropdown } from "./Dropdown";

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

const options = THEME_PRESETS.map((t) => ({
    id: t.name,
    label: t.name + (t.dark ? "" : " (light)"),
    extra: <Mini theme={t} />,
}));

function ThemePicker({ value, onChange }: Props){
    return <Dropdown value={value} options={options} onChange={onChange} />
}

export { ThemePicker }