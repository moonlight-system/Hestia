import "./Rules.css";
import { useState, type CSSProperties } from "react";
import {
    addDoc, arrayRemove, arrayUnion, collection, deleteDoc, deleteField,
    doc, Timestamp, updateDoc, writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useHouseholdId } from "../HouseholdContext";
import { useMembers } from "../useMembers";
import { useRules } from "../useRules";
import { RuleModal, type RuleData, type RuleModalMode } from "./RuleModal";
import { ContextMenu } from "./ContextMenu";
import type { Person, Rule } from "../Types";


type ModalState = { mode: RuleModalMode; id?: string; initial: RuleData };
type MenuState = { x: number; y: number; rule: Rule };

type CardProps = {
    rule: Rule;
    members: Person[];
    me: string;
    onToggle: (rule: Rule) => void;
    onContext: (rule: Rule, x: number, y: number) => void;
};

function RuleCard({ rule, members, me, onToggle, onContext }: CardProps){
    return(
        <div
            className="rule_card"
            onContextMenu={(e) => {
                e.preventDefault();
                onContext(rule, e.clientX, e.clientY);
            }}
        >
            <div className="rule_main">
                <div className="rule_name">{rule.name}</div>
                {rule.description && <div className="rule_desc">{rule.description}</div>}
            </div>

            <div className="rule_boxes">
                {members.map((m) => (
                    <label
                        key={m.id}
                        className="rule_box"
                        style={{ "--box-color": m.color ?? "var(--main-accent-color)" } as CSSProperties}
                    >
                        <input
                            type="checkbox"
                            checked={rule.agreed.includes(m.id)}
                            disabled={m.id !== me}
                            onChange={() => onToggle(rule)}
                        />
                        <span>{m.name}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}

function Rules(){
    const hid = useHouseholdId();
    const members = useMembers();
    const rules = useRules();
    const me = auth.currentUser!.uid;

    const [modal, setModal] = useState<ModalState | null>(null);
    const [menu, setMenu] = useState<MenuState | null>(null);

    const col = collection(db, "households", hid, "rules");

    const sorted = [...rules].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const allAccepted = rules.length > 0 && rules.every((r) => r.agreed.includes(me));

    function openCreate(){
        setModal({ mode: "create", initial: { name: "" } });
    }

    function openEdit(rule: Rule){
        setModal({
            mode: "edit",
            id: rule.id,
            initial: { name: rule.name, description: rule.description },
        });
    }

    async function save(data: RuleData){
        if (!modal) return;
        if (modal.id) {
            await updateDoc(doc(col, modal.id), {
                name: data.name,
                // deleteField removes a description that was cleared
                description: data.description ?? deleteField(),
            });
        } else {
            await addDoc(col, {
                name: data.name,
                agreed: [],
                createdAt: Timestamp.now(),
                // Firestore rejects `undefined`, so only include it when set
                ...(data.description ? { description: data.description } : {}),
            });
        }
        setModal(null);
    }

    async function toggle(rule: Rule){
        try {
            await updateDoc(doc(col, rule.id), {
                // arrayUnion/arrayRemove keep simultaneous ticks from overwriting each other
                agreed: rule.agreed.includes(me) ? arrayRemove(me) : arrayUnion(me),
            });
        } catch (err) {
            console.error(err);
        }
    }

    async function toggleAll(){
        try {
            // One batch: every rule updates together or none do
            const batch = writeBatch(db);
            for (const r of rules) {
                batch.update(doc(col, r.id), {
                    agreed: allAccepted ? arrayRemove(me) : arrayUnion(me),
                });
            }
            await batch.commit();
        } catch (err) {
            console.error(err);
        }
    }

    async function remove(rule: Rule){
        await deleteDoc(doc(col, rule.id));
    }

    return(
        <div className="rules_container">
            <div className="rules_toolbar">
                <h2 className="rules_title">Rules</h2>

                <div className="rules_actions">
                    <label className="rules_accept_all">
                        <input
                            type="checkbox"
                            checked={allAccepted}
                            disabled={rules.length === 0}
                            onChange={toggleAll}
                        />
                        Accept all
                    </label>
                    <button className="rules_new" onClick={openCreate}>+ Add rule</button>
                </div>
            </div>

            <div className="rules_list">
                {sorted.length === 0 && <div className="rules_empty">No rules yet.</div>}
                {sorted.map((r) => (
                    <RuleCard
                        key={r.id}
                        rule={r}
                        members={members}
                        me={me}
                        onToggle={toggle}
                        onContext={(rule, x, y) => setMenu({ x, y, rule })}
                    />
                ))}
            </div>

            {modal && (
                <RuleModal
                    mode={modal.mode}
                    initial={modal.initial}
                    onSave={save}
                    onClose={() => setModal(null)}
                />
            )}

            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    onClose={() => setMenu(null)}
                    onEdit={() => openEdit(menu.rule)}
                    onDelete={() => remove(menu.rule)}
                />
            )}
        </div>
    )
}

export { Rules }