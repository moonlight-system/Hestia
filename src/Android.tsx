import "./Android.css"
import { useState } from "react"
import { Calendar } from "./Pages/Calendar"
import { Tasks } from "./Pages/Tasks"
import { Asks } from "./Pages/Asks"
import { Debts } from "./Pages/Debts"
import { Rules } from "./Pages/Rules"
import { Settings } from "./Pages/Settings"

const TABS = ["Calendar", "Tasks", "Asks", "Debts", "Rules"] as const;
type Page = typeof TABS[number] | "Settings";

function Android(){
    const [page, setPage] = useState<Page>("Calendar");

    return(
        <div className="mobile_container">
            <div className="mobile_header">
                <div className="mobile_title">Hestia</div>
                <button
                    className={page === "Settings" ? "mobile_gear active" : "mobile_gear"}
                    onClick={() => setPage("Settings")}
                >
                    ⚙
                </button>
            </div>

            <div className="mobile_page">
                {page === "Calendar" && <Calendar />}
                {page === "Tasks" && <Tasks />}
                {page === "Asks" && <Asks />}
                {page === "Debts" && <Debts />}
                {page === "Rules" && <Rules />}
                {page === "Settings" && <Settings />}
            </div>

            <div className="mobile_tabs">
                {TABS.map((t) => (
                    <button
                        key={t}
                        className={t === page ? "mobile_tab active" : "mobile_tab"}
                        onClick={() => setPage(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>
    )
}

export { Android };