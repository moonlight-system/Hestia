import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";

const LATEST = "https://api.github.com/repos/moonlight-system/Hestia/releases/latest";

export type AppUpdate = { version: string; url: string };

// "v0.1.2" -> [0, 1, 2]
function parse(v: string): number[] {
    return v.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
}

function isNewer(latest: string, current: string): boolean {
    const a = parse(latest);
    const b = parse(current);
    for (let i = 0; i < 3; i++) {
        if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
    }
    return false;
}

export function useAndroidUpdate(): AppUpdate | null {
    const [update, setUpdate] = useState<AppUpdate | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function check() {
            try {
                const [current, res] = await Promise.all([
                    getVersion(),
                    fetch(LATEST, { headers: { Accept: "application/vnd.github+json" } }),
                ]);
                if (!res.ok) return;
                const release = await res.json();
                // The release exists a few minutes before the CI job attaches the APK,
                // so no .apk yet simply means "no update yet"
                const apk = release.assets?.find((a: { name: string }) => a.name.endsWith(".apk"));
                if (!cancelled && apk && isNewer(release.tag_name, current)) {
                    setUpdate({ version: release.tag_name, url: apk.browser_download_url });
                }
            } catch (err) {
                console.error("Update check failed:", err);
            }
        }

        check();
        // Check again whenever the app comes back to the foreground
        const onVisible = () => { if (document.visibilityState === "visible") check(); };
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            cancelled = true;
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, []);

    return update;
}