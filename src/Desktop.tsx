import "./Desktop.css"
import { useState } from "react"
import { Calendar } from "./Pages/Calendar"
import { Tasks } from "./Pages/Tasks"
import { Asks } from "./Pages/Asks"
import { Debts } from "./Pages/Debts"
import { Rules } from "./Pages/Rules"
import { Groceries } from "./Pages/Groceries"
import { Settings } from "./Pages/Settings"
import { Download } from "lucide-react"
import { useDesktopUpdate } from "./useDesktopUpdate"
import { t } from "./i18n";


function Desktop(){
    const { update, busy, error, install } = useDesktopUpdate();
    const PAGES = ["Calendar", "Tasks", "Groceries", "Asks", "Debts", "Rules", "Settings"] as const;
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
                        {t(p)}
                    </button>
                ))}
                {update && (
                    <div className="nav_update">
                        <div className="nav_update_text">{t("An update is available")}</div>
                        {error ? (
                            <div className="nav_update_error">{t("Update failed:")} {error}</div>
                        ) : (
                            <button className="nav_update_btn" disabled={busy} onClick={install}>
                                <Download size={16} />
                                {busy ? t("Updating…") : t("Update")}
                            </button>
                        )}
                    </div>
                )}
                <button
                    className={page === "Settings" ? "nav_menu_item nav_menu_bottom active" : "nav_menu_item nav_menu_bottom"}
                    onClick={() => setPage("Settings")}
                >
                    {t("Settings")}
                </button>
            </div>

            <div className="desktop_page">
                {page=="Calendar" && (
                    <Calendar/>
                )}

                {page=="Tasks" && (
                    <Tasks/>
                )}

                {page=="Groceries" && (
                    <Groceries/>
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