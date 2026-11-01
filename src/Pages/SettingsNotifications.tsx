import { useState } from "react";
import { isAndroid } from "../platform";
import { loadNotifPrefs, saveNotifPrefs, type NotifPrefs } from "../notifPrefs";

function SettingsNotifications(){
    const [prefs, setPrefs] = useState<NotifPrefs>(loadNotifPrefs);

    function update(patch: Partial<NotifPrefs>){
        const next = { ...prefs, ...patch };
        setPrefs(next);
        saveNotifPrefs(next);   // the scheduler picks this up immediately
    }

    if (!isAndroid) {
        return <div className="settings_hint">Task reminders are only available in the Android app.</div>;
    }

    return(
        <>
            <div className="settings_card">
                <h3>Reminders</h3>
                <label className="settings_check">
                    <input
                        type="checkbox"
                        checked={prefs.enabled}
                        onChange={(e) => update({ enabled: e.target.checked })}
                    />
                    Notify me about tasks that are due soon
                </label>
                <div className="settings_hint">
                    If nothing shows up, check Android Settings → Apps → Hestia → Notifications.
                </div>
            </div>

            <div className="settings_card">
                <h3>Morning reminder</h3>
                <label className="settings_check">
                    <input
                        type="checkbox"
                        checked={prefs.morning}
                        disabled={!prefs.enabled}
                        onChange={(e) => update({ morning: e.target.checked })}
                    />
                    Remind me at 6:00 about every task due today
                </label>
                <div className="settings_hint">
                    How early the other reminder comes is set on each task, for tasks that have a due time.
                </div>
            </div>

            <div className="settings_card">
                <h3>Activity</h3>
                <label className="settings_check">
                    <input
                        type="checkbox"
                        checked={prefs.activity}
                        onChange={(e) => update({ activity: e.target.checked })}
                    />
                    Notify me about new asks and new tasks for me
                </label>
                <div className="settings_hint">
                    Only works while the app is running in the background.
                </div>
            </div>
            
            <div className="settings_card">
                <h3>Sound</h3>
                <label className="settings_check">
                    <input
                        type="checkbox"
                        checked={prefs.silent}
                        disabled={!prefs.enabled}
                        onChange={(e) => update({ silent: e.target.checked })}
                    />
                    Silent notifications (no sound or vibration)
                </label>
            </div>

            <div className="settings_hint">These choices are saved on this device only.</div>
        </>
    )
}

export { SettingsNotifications }