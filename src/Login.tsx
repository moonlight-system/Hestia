import { useState, type FormEvent } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";
import { auth } from "./firebase";
import "./Login.css";

function Login(){
    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function submit(e: FormEvent){
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            if (mode === "signup") {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(cred.user, { displayName: name.trim() });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            setError(friendlyError(err.code));
        } finally {
            setBusy(false);
        }
    }

    return(
        <div className="login_container">
            <form className="login_form" onSubmit={submit}>
                <div className="login_title">Hestia</div>

                {mode === "signup" && (
                    <input
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                )}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password (6+ characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {error && <div className="login_error">{error}</div>}

                <button type="submit" className="login_submit" disabled={busy}>
                    {mode === "signin" ? "Sign in" : "Create account"}
                </button>

                <button
                    type="button"
                    className="login_switch"
                    onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
                >
                    {mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"}
                </button>
            </form>
        </div>
    )
}

function friendlyError(code: string){
    switch (code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Wrong email or password.";
        case "auth/email-already-in-use":
            return "An account with this email already exists.";
        case "auth/weak-password":
            return "Password must be at least 6 characters.";
        case "auth/invalid-email":
            return "That email doesn't look valid.";
        case "auth/network-request-failed":
            return "No connection. Check your internet and try again.";
        default:
            return "Something went wrong. Try again.";
    }
}

export { Login }