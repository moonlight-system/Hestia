import { useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export function useDesktopUpdate() {
    const [update, setUpdate] = useState<Update | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    // Only looks for an update; nothing is downloaded until the user asks
    useEffect(() => {
        check().then(setUpdate).catch((err) => console.error("Update check failed:", err));
    }, []);

    async function install() {
        if (!update) return;
        setBusy(true);
        setError("");
        try {
            await update.downloadAndInstall();
            await relaunch();
        } catch (err) {
            setError(String(err));
            setBusy(false);
        }
    }

    return { update, busy, error, install };
}