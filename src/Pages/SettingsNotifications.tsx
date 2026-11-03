import { useState } from "react";
import { isAndroid } from "../platform";
import { loadNotifPrefs, saveNotifPrefs, type NotifPrefs } from "../notifPrefs";
import { t } from "../i18n";

function SettingsNotifications(){
    const [prefs, setPrefs] = useState<NotifPrefs>(loadNotifPrefs);

    function update(patch: Partial<NotifPrefs>){
        const next = { ...prefs, ...patch };
        setPrefs(next);
        saveNotifPrefs(next);   // the scheduler picks this up immediately
    }

    if (!isAndroid) {
        return <div className="settings_hint">{t("Task reminders are only available in the Android app.")}</div>;
    }

    return(
        <>
            <div className="settings_card">
                <h3>{t("Reminders")}</h3>
                <label className="settings_check">
                    <input
                        type="checkbox"
                        checked={prefs.enabled}
                        onChange={(e) => update({ enabled: e.target.checked })}
                    />
                    {t("Notify me about tasks that are due soon")}
                </label>
                <div className="settings_hint">
                    {t("If nothing shows up, check Android Settings → Apps → Hestia → Notifications.")}
                </div>
            </div>

            <div className="settings_card">
                <h3>{t("Morning reminder")}</h3>
                <label className="settings_check">
                    <input
                        type="checkbox"
                        checked={prefs.morning}
                        disabled={!prefs.enabled}
                        onChange={(e) => update({ morning: e.target.checked })}
                    />
                    {t("Remind me at 6:00 about every task due today")}
                </label>
                <div className="settings_hint">
                    {t("How early the other reminder comes is set on each task, for tasks that have a due time.")}
                </div>
            </div>

            <div className="settings_card">
                <h3>{t("Activity")}</h3>
                <label className="settings_check">
                    <input
                        type="checkbox"
                        checked={prefs.activity}
                        onChange={(e) => update({ activity: e.target.checked })}
                    />
                    {t("Notify me about new asks and new tasks for me")}
                </label>
                <div className="settings_hint">
                    {t("Only works while the app is running in the background.")}
                </div>
            </div>
            
            <div className="settings_card">
                <h3>{t("Sound")}</h3>
                <label className="settings_check">
                    <input
                        type="checkbox"
                        checked={prefs.silent}
                        disabled={!prefs.enabled}
                        onChange={(e) => update({ silent: e.target.checked })}
                    />
                    {t("Silent notifications (no sound or vibration)")}
                </label>
            </div>

            <div className="settings_hint">{t("These choices are saved on this device only.")}</div>
        </>
    )
}

export { SettingsNotifications }