import "./Groceries.css";
import { Fragment, useState, type FormEvent } from "react";
import { addDoc, collection, deleteDoc, deleteField, doc, Timestamp, updateDoc } from "firebase/firestore";
import { GroceryModal, type GroceryData } from "./GroceryModal";
import { auth, db } from "../firebase";
import { useHouseholdId } from "../HouseholdContext";
import { useMembers } from "../useMembers";
import { useGroceries } from "../useGroceries";
import { ContextMenu } from "./ContextMenu";
import { isAndroid } from "../platform";
import { locale, t } from "../i18n";
import type { GroceryStaple, Person } from "../Types";

type Kind = "staple" | "item";
type MenuState = { x: number; y: number; kind: Kind; id: string; name: string; forId?: string };
type ModalState = { kind: Kind; id: string; initial: GroceryData };

function Groceries(){
    const hid = useHouseholdId();
    const members = useMembers();
    const { staples, items } = useGroceries();
    const me = auth.currentUser!.uid;

    const [stapleDraft, setStapleDraft] = useState("");
    const [itemDraft, setItemDraft] = useState("");
    const [menu, setMenu] = useState<MenuState | null>(null);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    const [stapleFor, setStapleFor] = useState(me);   // defaults to me; "" = everyone
    const [itemFor, setItemFor] = useState(me);
    const [modal, setModal] = useState<ModalState | null>(null);

    const stapleCol = collection(db, "households", hid, "groceryStaples");
    const itemCol = collection(db, "households", hid, "groceryItems");
    const nameOf = (p: Person) => members.find((m) => m.id === p.id)?.name ?? p.name;

    // Things we're out of first, then alphabetical
    const sortedStaples = [...staples].sort((a, b) =>
        Number(b.needed) - Number(a.needed) || a.name.localeCompare(b.name, locale()));
    const sortedItems = [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const neededCount = staples.filter((s) => s.needed).length;

    async function addStaple(e: FormEvent){
        e.preventDefault();
        const name = stapleDraft.trim();
        if (!name) return;
        setStapleDraft("");
        try {
            await addDoc(stapleCol, {
                name, needed: false, createdAt: Timestamp.now(),
                // Firestore rejects `undefined`, so only write forId when set
                ...(stapleFor ? { forId: stapleFor } : {}),
            });
        } catch (err) { console.error(err); }
    }

    async function toggleStaple(s: GroceryStaple){
        try {
            await updateDoc(doc(stapleCol, s.id), { needed: !s.needed });
        } catch (err) { console.error(err); }
    }

    async function addItem(e: FormEvent){
        e.preventDefault();
        const name = itemDraft.trim();
        if (!name) return;
        setItemDraft("");
        const myName = members.find((m) => m.id === me)?.name ?? auth.currentUser!.displayName ?? "";
        try {
            await addDoc(itemCol, {
                name,
                addedBy: { id: me, name: myName },
                createdAt: Timestamp.now(),
                ...(itemFor ? { forId: itemFor } : {}),
            });
        } catch (err) { console.error(err); }
    }

    async function remove(kind: Kind, id: string){
        try {
            await deleteDoc(doc(kind === "staple" ? stapleCol : itemCol, id));
        } catch (err) { console.error(err); }
    }

    async function saveEdit(data: GroceryData){
        if (!modal) return;
        const col = modal.kind === "staple" ? stapleCol : itemCol;
        // deleteField turns a person back into "everyone"
        await updateDoc(doc(col, modal.id), { name: data.name, forId: data.forId ?? deleteField() });
        setModal(null);
    }

    // Splits a list into groups: me first, then everyone, then the other roommates.
    // An item for someone who left the household falls back to "everyone".
    // Empty groups are dropped. The order inside each group is kept.
    function group<T extends { forId?: string }>(list: T[]) {
        const known = new Set(members.map((m) => m.id));
        const target = (x: T) => (x.forId && known.has(x.forId) ? x.forId : "");
        const ids = [me, "", ...members.filter((m) => m.id !== me).map((m) => m.id)];
        return ids
            .map((id) => ({
                id,
                title: id === me ? t("Mine")
                    : id === "" ? t("For everyone")
                    : members.find((m) => m.id === id)?.name ?? "",
                list: list.filter((x) => target(x) === id),
            }))
            .filter((g) => g.list.length > 0);
    }

    const personSelect = (value: string, onChange: (v: string) => void) => (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">{t("Everyone")}</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
    );

    const staplesBody = (
        <>
            <form className="groc_add" onSubmit={addStaple}>
                <input
                    placeholder={t("Add a usual item…")}
                    value={stapleDraft}
                    onChange={(e) => setStapleDraft(e.target.value)}
                />
                {personSelect(stapleFor, setStapleFor)}
                <button type="submit">{t("Add")}</button>
            </form>
            {sortedStaples.length === 0 && <div className="groc_empty">{t("Nothing here yet.")}</div>}
            {group(sortedStaples).map((g) => (
                <Fragment key={g.id}>
                    <div className="groc_group">{g.title}</div>
                    {g.list.map((s) => (
                        <label
                            key={s.id}
                            className={s.needed ? "groc_row needed" : "groc_row"}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setMenu({ x: e.clientX, y: e.clientY, kind: "staple", id: s.id, name: s.name, forId: s.forId });
                            }}
                        >
                            <input type="checkbox" checked={s.needed} onChange={() => toggleStaple(s)} />
                            <span className="groc_name">{s.name}</span>
                        </label>
                    ))}
                </Fragment>
            ))}
            <div className="groc_hint">
                {t("Tick what we're out of. Untick it once bought. Right-click (or long-press) an item to edit or delete it.")}
            </div>
        </>
    );

    const itemsBody = (
        <>
            <form className="groc_add" onSubmit={addItem}>
                <input
                    placeholder={t("Add an item…")}
                    value={itemDraft}
                    onChange={(e) => setItemDraft(e.target.value)}
                />
                {personSelect(itemFor, setItemFor)}
                <button type="submit">{t("Add")}</button>
            </form>
            {sortedItems.length === 0 && <div className="groc_empty">{t("Nothing here yet.")}</div>}
            {group(sortedItems).map((g) => (
                <Fragment key={g.id}>
                    <div className="groc_group">{g.title}</div>
                    {g.list.map((i) => (
                        <div
                            key={i.id}
                            className="groc_row"
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setMenu({ x: e.clientX, y: e.clientY, kind: "item", id: i.id, name: i.name, forId: i.forId });
                            }}
                        >
                            <span className="groc_name">{i.name}</span>
                            <span className="groc_by">{nameOf(i.addedBy)}</span>
                            <button className="groc_remove" title={t("Remove")} onClick={() => remove("item", i.id)}>✕</button>
                        </div>
                    ))}
                </Fragment>
            ))}
        </>
    );

    // Order matters: first = left column on desktop, top on mobile
    const sections = [
        { id: "staples", title: t("Usual items"), count: `${neededCount}/${staples.length}`, body: staplesBody },
        { id: "free", title: t("Shopping list"), count: String(items.length), body: itemsBody },
    ];

    return(
        <div className="groc_container">
            <div className="groc_inner">
                <h2 className="groc_title">{t("Groceries")}</h2>

                <div className="groc_wrap">
                    {sections.map((s) => isAndroid ? (
                        // Phone: stacked and collapsible
                        <Fragment key={s.id}>
                            <button
                                className="groc_toggle"
                                onClick={() => setCollapsed((c) => ({ ...c, [s.id]: !c[s.id] }))}
                            >
                                {collapsed[s.id] ? "▸" : "▾"} {s.title} ({s.count})
                            </button>
                            {!collapsed[s.id] && <div className="groc_col">{s.body}</div>}
                        </Fragment>
                    ) : (
                        // Desktop: side by side
                        <div className="groc_col" key={s.id}>
                            <h3 className="groc_heading">{s.title}</h3>
                            {s.body}
                        </div>
                    ))}
                </div>
            </div>

            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    onClose={() => setMenu(null)}
                    onEdit={() => setModal({ kind: menu.kind, id: menu.id, initial: { name: menu.name, forId: menu.forId } })}
                    onDelete={() => remove(menu.kind, menu.id)}
                />
            )}

            {modal && (
                <GroceryModal
                    initial={modal.initial}
                    members={members}
                    onSave={saveEdit}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    )
}

export { Groceries }