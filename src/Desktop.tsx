import "./Desktop.css"
import { useState } from "react"
import { Calendar } from "./Pages/Calendar"
import { Tasks } from "./Pages/Tasks"
import { Asks } from "./Pages/Asks"
import { Debts } from "./Pages/Debts"
import { Rules } from "./Pages/Rules"
import { Settings } from "./Pages/Settings"


function Desktop(){

    const PAGES = ["Calendar", "Tasks", "Asks", "Debts", "Rules", "Settings"] as const;
    type Page = typeof PAGES[number];
    const [page, setPage] = useState<Page>("Calendar");
    const TOP_PAGES = PAGES.filter((p) => p !== "Settings");

    return(
        <div className="desktop_container">
            <div className="nav_menu">
                <div className="App_title">Hestia</div>
                {TOP_PAGES.map((p) => (
                    <button
                        key={p}
                        className={p === page ? "nav_menu_item active" : "nav_menu_item"}
                        onClick={() => setPage(p)}
                    >
                        {p}
                    </button>
                ))}
                <button
                    className={page === "Settings" ? "nav_menu_item nav_menu_bottom active" : "nav_menu_item nav_menu_bottom"}
                    onClick={() => setPage("Settings")}
                >
                    Settings
                </button>
            </div>

            <div className="desktop_page">
                {page=="Calendar" && (
                    <Calendar/>
                )}

                {page=="Tasks" && (
                    <Tasks/>
                )}

                {page=="Asks" && (
                    <Asks/>
                )}

                {page=="Debts" && (
                    <Debts/>
                )}

                {page=="Rules" && (
                    <Rules/>
                )}

                {page=="Settings" && (
                    <Settings/>
                )}
            </div>

        </div>
    )
}

export { Desktop };