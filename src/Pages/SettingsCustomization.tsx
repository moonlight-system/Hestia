import { useState } from "react";
import { THEME_PRESETS } from "../themes";
import {
    FONTS, SIZES, applyPrefs, loadPrefs, savePrefs, type Prefs,
} from "../preferences";

function SettingsCustomization(){
    const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

    function update(patch: Partial<Prefs>){
        const next = { ...prefs, ...patch };
        setPrefs(next);
        savePrefs(next);
        applyPrefs(next);   // takes effect immediately
    }

    const theme = THEME_PRESETS.find((t) => t.name === prefs.theme) ?? THEME_PRESETS[0];
    const swatches = [
        "--base-bg-color", "--darker-bg-color", "--darkest-bg-color",
        "--main-accent-color", "--secondary-accent-color",
    ];

    return(
        <>
            <div className="settings_card">
                <h3>Theme</h3>
                <div className="settings_row">
                    <select
                        className="settings_input"
                        value={theme.name}
                        onChange={(e) => update({ theme: e.target.value })}
                    >
                        {THEME_PRESETS.map((t) => (
                            <option key={t.name} value={t.name}>
                                {t.name}{t.dark ? "" : " (light)"}
                            </option>
                        ))}
                    </select>
                    <div className="theme_preview">
                        {swatches.map((v) => (
                            <span key={v} style={{ backgroundColor: theme.colors[v] }} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="settings_card">
                <h3>Font</h3>
                <select
                    className="settings_input"
                    value={prefs.font}
                    onChange={(e) => update({ font: e.target.value })}
                >
                    {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <div className="settings_hint">
                    Only fonts installed on your device are used, so a font may look different on another device.
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