import { useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { isAndroid } from "./platform";
import { Desktop } from "./Desktop"
import { Android } from "./Android"
import "./App.css";

function App() {
  useEffect(() => {
    if (isAndroid) return;   // phones update through the APK banner (step 8)
    (async () => {
      try {
        const update = await check();
        if (update) {
          await update.downloadAndInstall();
          await relaunch();
        }
      } catch (err) {
        console.error("Update check failed:", err);
      }
    })();
  }, []);

  return (
    <div className="AppContainer">
      {isAndroid ? <Android/> : <Desktop/>}
    </div>
  );
}
export default App;