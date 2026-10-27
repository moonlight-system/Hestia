import "./Asks.css"
import { addDoc, collection, deleteDoc, doc, Timestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useHouseholdId } from "../HouseholdContext";
import { useMembers } from "../useMembers";
import { useAsks } from "../useAsks";
import { AskModal, type AskData } from "./AskModal";
import { ContextMenu } from "./ContextMenu";
import type { Answer, Ask, Person } from "../Types";
import { useState, type CSSProperties } from "react";

type MenuState = { x: number; y: number; ask: Ask };

type CardProps = {
    ask: Ask;
    members: Person[];
    me: string;
    onAnswer: (ask: Ask, answer: Answer) => Promise<void>;
    onContext: (ask: Ask, x: number, y: number) => void;
};

function AskCard({ ask, members, me, onAnswer, onContext }: CardProps){
    const mine = ask.answers[me];
    const [editing, setEditing] = useState(false);
    const [vote, setVote] = useState<boolean | undefined>(mine?.vote);
    const [text, setText] = useState(mine?.text ?? "");
    const [busy, setBusy] = useState(false);

    const answered = members.filter((m) => ask.answers[m.id]).length;
    // Every enabled part must be filled in
    const canSend = (!ask.vote || vote !== undefined) && (!ask.text || text.trim() !== "");

    async function send(v: boolean | undefined, t: string){
        setBusy(true);
        try {
            await onAnswer(ask, { vote: v, text: t.trim() || undefined });
            setEditing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setBusy(false);
        }
    }

    function pick(v: boolean){
        setVote(v);
        // Vote-only asks: one click is the whole answer
        if (!ask.text) send(v, "");
    }

    function startEditing(){
        setVote(mine?.vote);
        setText(mine?.text ?? "");
        setEditing(true);
    }

    function form(){
        return(
            <div className="ask_form">
                {ask.vote && (
                    <div className="ask_votes">
                        <button
                            type="button"
                            className={vote === true ? "ask_vote yes active" : "ask_vote yes"}
                            disabled={busy}
                            onClick={() => pick(true)}
                        >✓</button>
                        <button
                            type="button"
                            className={vote === false ? "ask_vote no active" : "ask_vote no"}
                            disabled={busy}
                            onClick={() => pick(false)}
                        >✗</button>
                    </div>
                )}
                {ask.text && (
                    <>
                        <input
                            className="ask_input"
                            placeholder="Your answer…"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && canSend) send(vote, text); }}
                        />
                        <button
                            type="button"
                            className="ask_send"
                            disabled={!canSend || busy}
                            onClick={() => send(vote, text)}
                        >Send</button>
                    </>
                )}
            </div>
        )
    }

    return(
        <div
            className="ask_card"
            onContextMenu={(e) => {
                // Only the author can delete, so only they get a menu
                if (ask.author.id !== me) return;
                e.preventDefault();
                onContext(ask, e.clientX, e.clientY);
            }}
        >
            <div className="ask_head">
                <div className="ask_content">{ask.content}</div>
                <div className="ask_meta">
                    {members.find((m) => m.id === ask.author.id)?.name ?? ask.author.name}
                    {" · "}{answered}/{members.length} answered
                </div>
            </div>

            <div className="ask_slots">
                {members.map((m) => {
                    const a = ask.answers[m.id];
                    const isMe = m.id === me;
                    return(
                        <div
                            key={m.id}
                            className={a ? "ask_slot filled" : "ask_slot"}
                            style={m.color ? ({ "--slot-color": m.color } as CSSProperties) : undefined}
                        >
                            <div className="ask_who">
                                <span
                                    className="member_dot"
                                    style={{ backgroundColor: m.color ?? "var(--main-accent-color)" }}
                                />
                                {m.name}
                            </div>

                            {isMe && (!a || editing) ? form()
                            : a ? (
                                <div className="ask_answer">
                                    {a.vote !== undefined && (
                                        <span className={a.vote ? "ask_mark yes" : "ask_mark no"}>
                                            {a.vote ? "✓" : "✗"}
                                        </span>
                                    )}
                                    {a.text && <span className="ask_text">{a.text}</span>}
                                    {isMe && (
                                        <button className="ask_change" onClick={startEditing}>
                                            Change
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="ask_waiting">Waiting…</div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function Asks(){
    const hid = useHouseholdId();
    const members = useMembers();
    const asks = useAsks();
    const me = auth.currentUser!.uid;

    const [creating, setCreating] = useState(false);
    const [menu, setMenu] = useState<MenuState | null>(null);

    const col = collection(db, "households", hid, "asks");

    async function create(data: AskData){
        const name = members.find((m) => m.id === me)?.name
            ?? auth.currentUser!.displayName ?? "";
        await addDoc(col, {
            author: { id: me, name },
            content: data.content,
            vote: data.vote,
            text: data.text,
            answers: {},
            createdAt: Timestamp.now(),
        });
        setCreating(false);
    }

    async function answer(ask: Ask, a: Answer){
        // Firestore rejects `undefined`, so only include what is set
        const payload: Record<string, unknown> = {};
        if (a.vote !== undefined) payload.vote = a.vote;
        if (a.text) payload.text = a.text;
        // Dot path = touch only my slot, never anyone else's
        await updateDoc(doc(col, ask.id), { [`answers.${me}`]: payload });
    }

    async function remove(ask: Ask){
        await deleteDoc(doc(col, ask.id));
    }

    return(
        <div className="asks_container">
            <div className="asks_toolbar">
                <h2 className="asks_title">Asks</h2>
                <button className="asks_new" onClick={() => setCreating(true)}>+ New ask</button>
            </div>

            <div className="asks_list">
                {asks.length === 0 && <div className="asks_empty">No asks yet.</div>}
                {asks.map((a) => (
                    <AskCard
                        key={a.id}
                        ask={a}
                        members={members}
                        me={me}
                        onAnswer={answer}
                        onContext={(ask, x, y) => setMenu({ x, y, ask })}
                    />
                ))}
            </div>

            {creating && <AskModal onSave={create} onClose={() => setCreating(false)} />}

            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    onClose={() => setMenu(null)}
                    onDelete={() => remove(menu.ask)}
                />
            )}
        </div>
    )
}

export { Asks }