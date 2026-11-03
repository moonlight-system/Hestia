import { useEffect, useState, type FormEvent } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useHouseholdId } from "../HouseholdContext";
import { useMembers } from "../useMembers";
import { t } from "../i18n";

type HouseholdDoc = { name: string; inviteCode: string; ownerId: string };

function SettingsHousehold(){
    const hid = useHouseholdId();
    const members = useMembers();
    const me = auth.currentUser?.uid;

    const [household, setHousehold] = useState<HouseholdDoc | null>(null);
    const [name, setName] = useState("");
    const [msg, setMsg] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let first = true;
        return onSnapshot(doc(db, "households", hid), (snap) => {
            const data = snap.data() as HouseholdDoc | undefined;
            setHousehold(data ?? null);
            // Fill the name box once; after that the user's typing is left alone
            if (first && data) { setName(data.name); first = false; }
        });
    }, [hid]);

    async function rename(e: FormEvent){
        e.preventDefault();
        const clean = name.trim();
        if (!clean) return;
        try {
            await updateDoc(doc(db, "households", hid), { name: clean });
            setMsg(t("Saved."));
        } catch (err) {
            console.error(err);
            setMsg(t("Could not save. Try again."));
        }
    }

    async function copyCode(){
        if (!household) return;
        try {
            await navigator.clipboard.writeText(household.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard unavailable: the code is on screen to copy by hand
        }
    }

    if (!household) return <div className="settings_hint">{t("Loading…")}</div>;

    return(
        <>
            <form className="settings_card" onSubmit={rename}>
                <h3>{t("Household name")}</h3>
                <div className="settings_row">
                    <input
                        className="settings_input"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setMsg(""); }}
                        required
                    />
                    <button className="settings_btn" type="submit">{t("Save")}</button>
                </div>
                {msg && <div className="settings_hint">{msg}</div>}
            </form>

            <div className="settings_card">
                <h3>{t("Invite code")}</h3>
                <div className="settings_row">
                    <div className="invite_code">{household.inviteCode}</div>
                    <button className="settings_btn" onClick={copyCode}>
                        {copied ? t("Copied!") : t("Copy")}
                    </button>
                </div>
                <div className="settings_hint">
                    {t("Give this code to a roommate. They enter it after creating their account.")}
                </div>
            </div>

            <div className="settings_card">
                <h3>{t("Members")} ({members.length})</h3>
                {members.map((m) => (
                    <div className="member_row" key={m.id}>
                        <span
                            className="member_dot"
                            style={{ backgroundColor: m.color ?? "var(--main-accent-color)" }}
                        />
                        <span className="member_name">{m.name}</span>
                        {m.id === me && <span className="member_tag">{t("you")}</span>}
                        {m.id === household.ownerId && <span className="member_tag">{t("owner")}</span>}
                    </div>
                ))}
            </div>
        </>
    )
}

export { SettingsHousehold }