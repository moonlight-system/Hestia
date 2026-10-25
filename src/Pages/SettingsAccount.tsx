import { useState, type FormEvent } from "react";
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useHouseholdId } from "../HouseholdContext";
import { useMembers } from "../useMembers";

const PALETTE = [
    "#e5383b", "#ff8a3d", "#ffcc4d", "#8ac926", "#34c17b", "#2dd4bf",
    "#38bdf8", "#5c7aff", "#9f7aea", "#f038e7", "#ff6b9d", "#a8a29e",
];

function SettingsAccount(){
    const hid = useHouseholdId();
    const members = useMembers();
    const user = auth.currentUser!;
    const me = members.find((m) => m.id === user.uid);

    const [name, setName] = useState(user.displayName ?? "");
    const [msg, setMsg] = useState("");
    const [busy, setBusy] = useState(false);

    async function saveName(e: FormEvent){
        e.preventDefault();
        const clean = name.trim();
        if (!clean) return;
        setBusy(true);
        setMsg("");
        try {
            await updateProfile(user, { displayName: clean });
            // Your name is stored in two Firestore places; update both together
            const batch = writeBatch(db);
            batch.update(doc(db, "users", user.uid), { name: clean });
            batch.update(doc(db, "households", hid, "members", user.uid), { name: clean });
            await batch.commit();
            setMsg("Saved.");
        } catch (err) {
            console.error(err);
            setMsg("Could not save. Try again.");
        } finally {
            setBusy(false);
        }
    }

    async function saveColor(color: string){
        try {
            await updateDoc(doc(db, "households", hid, "members", user.uid), { color });
        } catch (err) {
            console.error(err);
        }
    }

    return(
        <>
            <form className="settings_card" onSubmit={saveName}>
                <h3>Your name</h3>
                <div className="settings_row">
                    <input
                        className="settings_input"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setMsg(""); }}
                        required
                    />
                    <button className="settings_btn" type="submit" disabled={busy}>Save</button>
                </div>
                {msg && <div className="settings_hint">{msg}</div>}
            </form>

            <div className="settings_card">
                <h3>Your colour</h3>
                <div className="settings_hint">
                    Used on the calendar for events where you're the only participant.
                </div>
                <div className="swatches">
                    {PALETTE.map((c) => (
                        <button
                            key={c}
                            className={me?.color === c ? "swatch selected" : "swatch"}
                            style={{ backgroundColor: c }}
                            onClick={() => saveColor(c)}
                            title={c}
                        />
                    ))}
                </div>
            </div>

            <div className="settings_card">
                <h3>Session</h3>
                <div className="settings_hint">Signed in as {user.email}</div>
                <button className="settings_btn danger" onClick={() => signOut(auth)}>
                    Log out
                </button>
            </div>
        </>
    )
}

export { SettingsAccount }