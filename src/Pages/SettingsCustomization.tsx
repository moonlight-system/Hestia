import { useState } from "react";
import {
    FONTS, SIZES, applyPrefs, loadPrefs, savePrefs, type Prefs,
} from "../preferences";
import { EDITABLE_COLORS, THEME_PRESETS, resolveColor, withOverrides } from "../themes";
import { ThemePicker } from "./ThemePicker";
import { Dropdown } from "./Dropdown";

function SettingsCustomization(){
    const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

    function update(patch: Partial<Prefs>){
        const next = { ...prefs, ...patch };
        setPrefs(next);
        savePrefs(next);
        applyPrefs(next);   // takes effect immediately
    }

    const theme = THEME_PRESETS.find((t) => t.name === prefs.theme) ?? THEME_PRESETS[0];
    const font = FONTS.find((f) => f.id === prefs.font) ?? FONTS[0];
    const overrides = prefs.overrides[theme.name] ?? {};
    const hasCustom = Object.keys(overrides).length > 0;
    const shown = withOverrides(theme.colors, overrides);

    function setColor(key: string, value: string){
        update({ overrides: { ...prefs.overrides, [theme.name]: { ...overrides, [key]: value } } });
    }

    function resetColors(){
        const next = { ...prefs.overrides };
        delete next[theme.name];
        update({ overrides: next });
    }

    return(
        <>
            <div className="settings_card">
                <h3>Theme</h3>
                <ThemePicker value={theme.name} onChange={(name) => update({ theme: name })} />
                <div className="color_grid">
                    {EDITABLE_COLORS.map((c) => (
                        <label key={c.key} className="color_item">
                            <input
                                type="color"
                                value={resolveColor(shown, c.key)}
                                onChange={(e) => setColor(c.key, e.target.value)}
                            />
                            <span>{c.label}</span>
                        </label>
                    ))}
                </div>
                <div className="settings_hint">
                    Click a colour to change it. Your changes are kept separately for each theme.
                </div>
                {hasCustom && (
                    <button
                        className="settings_btn"
                        style={{ alignSelf: "flex-start" }}
                        onClick={resetColors}
                    >
                        Reset this theme's colours
                    </button>
                )}
            </div>

            <div className="settings_card">
                <h3>Font</h3>
                <Dropdown
                    value={font.id}
                    options={FONTS.map((f) => ({
                        id: f.id,
                        label: f.label,
                        // The default font has an empty stack, so it falls back to the app font
                        style: f.stack ? { fontFamily: f.stack } : undefined,
                    }))}
                    onChange={(id) => update({ font: id })}
                />
                <div className="settings_hint">
                    Monospace, System, Humanist and Serif use fonts already on your device, so they can look
                    different from one device to another. All the others are bundled with the app.
                </div>
            </div>

            <div className="settings_card">
                <h3>Text size</h3>
                <select
                    className="settings_input"
                    value={prefs.size}
                    onChange={(e) => update({ size: e.target.value })}
                >
                    {SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
            </div>

            <div className="settings_hint">These choices are saved on this device only.</div>
        </>
    )
}

export { SettingsCustomization }