import { useState, type FormEvent } from "react";
import { signOut } from "firebase/auth";
import {
    collection, doc, getDoc, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import "./Login.css";

// No 0/O or 1/I so codes are easy to read out loud
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode(length = 6){
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

function HouseholdSetup(){
    const [houseName, setHouseName] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function createHousehold(e: FormEvent){
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            const user = auth.currentUser!;
            const inviteCode = makeCode();
            const hRef = doc(collection(db, "households")); // auto-generated id
            const name = user.displayName ?? "";

            // One batch = all four writes succeed together or none do
            const batch = writeBatch(db);
            batch.set(hRef, {
                name: houseName.trim(),
                inviteCode,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            });
            batch.set(doc(db, "households", hRef.id, "members", user.uid), {
                name,
                joinedAt: serverTimestamp(),
            });
            batch.set(doc(db, "invites", inviteCode), { householdId: hRef.id });
            batch.set(doc(db, "users", user.uid), { name, householdId: hRef.id });
            await batch.commit();
        } catch (err) {
            console.error(err);
            setError("Could not create the household. Try again.");
        } finally {
            setBusy(false);
        }
    }

    async function joinHousehold(e: FormEvent){
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            const user = auth.currentUser!;
            const inviteCode = code.trim().toUpperCase();
            const name = user.displayName ?? "";

            const invite = await getDoc(doc(db, "invites", inviteCode));
            if (!invite.exists()) {
                setError("No household found with this code.");
                return;
            }
            const hid = invite.data().householdId as string;

            const batch = writeBatch(db);
            batch.set(doc(db, "households", hid, "members", user.uid), {
                name,
                inviteCode, // the security rules check this against the household's code
                joinedAt: serverTimestamp(),
            });
            batch.set(doc(db, "users", user.uid), { name, householdId: hid });
            await batch.commit();
        } catch (err) {
            console.error(err);
            setError("Could not join the household. Check the code and try again.");
        } finally {
            setBusy(false);
        }
    }

    return(
        <div className="login_container">
            <div className="login_form">
                <div className="login_title">Hestia</div>

                <form className="login_form" onSubmit={createHousehold}>
                    <input
                        placeholder="New household name"
                        value={houseName}
                        onChange={(e) => setHouseName(e.target.value)}
                        required
                    />
                    <button type="submit" className="login_submit" disabled={busy}>
                        Create household
                    </button>
                </form>

                <div className="login_or">or</div>

                <form className="login_form" onSubmit={joinHousehold}>
                    <input
                        placeholder="Invite code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                    />
                    <button type="submit" className="login_submit" disabled={busy}>
                        Join household
                    </button>
                </form>

                {error && <div className="login_error">{error}</div>}

                <button type="button" className="login_switch" onClick={() => signOut(auth)}>
                    Log out
                </button>
            </div>
        </div>
    )
}

export { HouseholdSetup }