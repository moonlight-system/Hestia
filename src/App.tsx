import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import { Login } from "./Login";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { isAndroid } from "./platform";
import { Desktop } from "./Desktop"
import { Android } from "./Android"
import "./App.css";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { HouseholdSetup } from "./HouseholdSetup";
import { HouseholdContext } from "./HouseholdContext";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setHouseholdId(null);
      setProfileReady(false);
      return;
    }
    return onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        setHouseholdId(snap.data()?.householdId ?? null);
        setProfileReady(true);
      },
      (err) => {
        console.error("Profile listener failed:", err);
        setProfileReady(true);
      },
    );
  }, [user]);

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

  if (!authReady || (user && !profileReady)) return <div className="AppContainer" />;

  return (
    <div className="AppContainer">
      {!user ? (
        <Login/>
      ) : !householdId ? (
        <HouseholdSetup/>
      ) : (
        <HouseholdContext.Provider value={householdId}>
          {isAndroid ? <Android/> : <Desktop/>}
        </HouseholdContext.Provider>
      )}
    </div>
  );
}
export default App;