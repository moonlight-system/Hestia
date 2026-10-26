import "./Debts.css";
import { useMemo, useState } from "react";
import {
    addDoc, collection, deleteDoc, deleteField, doc, Timestamp, updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useHouseholdId } from "../HouseholdContext";
import { useMembers } from "../useMembers";
import { useDebts } from "../useDebts";
import { DebtModal, type DebtForm, type DebtModalMode } from "./DebtModal";
import { ContextMenu } from "./ContextMenu";
import { formatMoney, hasCycle, simplify } from "../debtUtils";
import type { Debt, Person } from "../Types";

type ModalState = { mode: DebtModalMode; id?: string; initial: DebtForm };
type MenuState = { x: number; y: number; debt: Debt };

type CardProps = {
    debt: Debt;
    members: Person[];
    me: string;
    onToggle: (debt: Debt) => void;
    onContext: (debt: Debt, x: number, y: number) => void;
};

function DebtCard({ debt, members, me, onToggle, onContext }: CardProps){
    // Names are looked up live, so a renamed roommate shows their new name
    const nameOf = (p: Person) => members.find((m) => m.id === p.id)?.name ?? p.name;
    // Only the person who is owed can confirm the payment.
    // To let the debtor tick it too, add: || debt.debtor.id === me
    const canTick = debt.creditor.id === me;

    return(
        <div
            className={debt.paid ? "debt_card paid" : "debt_card"}
            onContextMenu={(e) => {
                e.preventDefault();
                onContext(debt, e.clientX, e.clientY);
            }}
        >
            <div className="debt_names">
                <span>{nameOf(debt.debtor)}</span>
                <span className="debt_owes">owes</span>
                <span>{nameOf(debt.creditor)}</span>
            </div>
            <div className="debt_amount">
                {debt.kind === "money" ? formatMoney(debt.cents ?? 0) : debt.what}
            </div>
            {debt.description && <div className="debt_desc">{debt.description}</div>}

            <label
                className="debt_box"
                title={canTick ? "Mark as paid back" : "Only the person who is owed can mark this as paid"}
            >
                <input
                    type="checkbox"
                    checked={debt.paid}
                    disabled={!canTick}
                    onChange={() => onToggle(debt)}
                />
            </label>
        </div>
    )
}

function Debts(){
    const hid = useHouseholdId();
    const members = useMembers();
    const debts = useDebts();
    const me = auth.currentUser!.uid;

    const [modal, setModal] = useState<ModalState | null>(null);
    const [menu, setMenu] = useState<MenuState | null>(null);
    const [showPaid, setShowPaid] = useState(false);

    const col = collection(db, "households", hid, "debts");

    const { open, paid, split, simple } = useMemo(() => {
        const open = debts
            .filter((d) => !d.paid)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const paid = debts
            .filter((d) => d.paid)
            .sort((a, b) =>
                (b.paidAt ?? b.createdAt).getTime() - (a.paidAt ?? a.createdAt).getTime());
        // Only open money debts can be netted against each other
        const money = open.filter((d) => d.kind === "money");
        return { open, paid, split: hasCycle(money), simple: simplify(money) };
    }, [debts]);

    const nameOf = (p: Person) => members.find((m) => m.id === p.id)?.name ?? p.name;

    function openCreate(){
        setModal({
            mode: "create",
            initial: {
                debtorId: me,
                creditorId: members.find((m) => m.id !== me)?.id ?? "",
                kind: "money",
            },
        });
    }

    function openEdit(debt: Debt){
        setModal({
            mode: "edit",
            id: debt.id,
            initial: {
                debtorId: debt.debtor.id,
                creditorId: debt.creditor.id,
                kind: debt.kind,
                cents: debt.cents,
                what: debt.what,
                description: debt.description,
            },
        });
    }

    async function save(data: DebtForm){
        if (!modal) return;
        const person = (id: string): Person => {
            const m = members.find((x) => x.id === id)!;
            return { id: m.id, name: m.name };
        };

        const fields: Record<string, unknown> = {
            debtor: person(data.debtorId),
            creditor: person(data.creditorId),
            kind: data.kind,
        };
        // Firestore rejects `undefined`, so optional fields are either written
        // or (when editing) removed
        const optional: Record<string, unknown> = {
            cents: data.cents,
            what: data.what,
            description: data.description,
        };
        for (const [key, value] of Object.entries(optional)) {
            if (value !== undefined) fields[key] = value;
            else if (modal.id) fields[key] = deleteField();
        }

        if (modal.id) {
            await updateDoc(doc(col, modal.id), fields);
        } else {
            fields.paid = false;
            fields.createdAt = Timestamp.now();
            await addDoc(col, fields);
        }
        setModal(null);
    }

    async function togglePaid(debt: Debt){
        try {
            await updateDoc(
                doc(col, debt.id),
                debt.paid
                    ? { paid: false, paidAt: deleteField() }
                    : { paid: true, paidAt: Timestamp.now() },
            );
        } catch (err) {
            console.error(err);
        }
    }

    async function remove(debt: Debt){
        await deleteDoc(doc(col, debt.id));
    }

    const card = (d: Debt) => (
        <DebtCard
            key={d.id}
            debt={d}
            members={members}
            me={me}
            onToggle={togglePaid}
            onContext={(debt, x, y) => setMenu({ x, y, debt })}
        />
    );

    return(
        <div className="debts_container">
            <div className={split ? "debts_wrap split" : "debts_wrap"}>
                <div className="debts_col">
                    <div className="debts_head">
                        <h2 className="debts_title">{split ? "All debts" : "Debts"}</h2>
                        <button className="debts_new" onClick={openCreate}>+ New debt</button>
                    </div>

                    {open.length === 0 && <div className="debts_empty">No open debts.</div>}
                    {open.map(card)}

                    {paid.length > 0 && (
                        <>
                            <button
                                className="debt_history_toggle"
                                onClick={() => setShowPaid((s) => !s)}
                            >
                                {showPaid ? "▾" : "▸"} Paid back ({paid.length})
                            </button>
                            {showPaid && paid.map(card)}
                        </>
                    )}
                </div>

                {split && (
                    <div className="debts_col">
                        <div className="debts_head">
                            <h2 className="debts_title">Simplified</h2>
                        </div>

                        {simple.length === 0 && (
                            <div className="debts_empty">Everything cancels out. All square!</div>
                        )}
                        {simple.map((t) => (
                            <div className="debt_card" key={t.from.id + t.to.id}>
                                <div className="debt_names">
                                    <span>{nameOf(t.from)}</span>
                                    <span className="debt_owes">owes</span>
                                    <span>{nameOf(t.to)}</span>
                                </div>
                                <div className="debt_amount">{formatMoney(t.cents)}</div>
                            </div>
                        ))}

                        <div className="debts_hint">
                            Open money debts, netted out. Tick the original debts as they get paid back.
                        </div>
                    </div>
                )}
            </div>

            {modal && (
                <DebtModal
                    mode={modal.mode}
                    initial={modal.initial}
                    members={members}
                    onSave={save}
                    onClose={() => setModal(null)}
                />
            )}

            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    onClose={() => setMenu(null)}
                    onEdit={() => openEdit(menu.debt)}
                    onDelete={() => remove(menu.debt)}
                />
            )}
        </div>
    )
}

export { Debts }