import "./Settings.css";
import { useState } from "react";
import { SettingsHousehold } from "./SettingsHousehold";
import { SettingsCustomization } from "./SettingsCustomization";
import { SettingsAccount } from "./SettingsAccount";
import { SettingsNotifications } from "./SettingsNotifications";


const TABS = ["Household", "Customization", "Notifications", "Account"] as const;
type Tab = typeof TABS[number];

function Settings(){
    const [tab, setTab] = useState<Tab>("Household");

    return(
        <div className="settings_container">
            <h2 className="settings_heading">Settings</h2>

            <div className="settings_tabs">
                {TABS.map((t) => (
                    <button
                        key={t}
                        className={t === tab ? "settings_tab active" : "settings_tab"}
                        onClick={() => setTab(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="settings_section">
                {tab === "Household" && <SettingsHousehold />}
                {tab === "Customization" && <SettingsCustomization />}
                {tab === "Notifications" && <SettingsNotifications />}
                {tab === "Account" && <SettingsAccount />}
            </div>
        </div>
    )
}

export { Settings }