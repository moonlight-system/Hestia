import "./Groceries.css";
import { Fragment, useState, type FormEvent } from "react";
import { addDoc, collection, deleteDoc, doc, Timestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useHouseholdId } from "../HouseholdContext";
import { useMembers } from "../useMembers";
import { useGroceries } from "../useGroceries";
import { ContextMenu } from "./ContextMenu";
import { isAndroid } from "../platform";
import { locale, t } from "../i18n";
import type { GroceryStaple, Person } from "../Types";

type MenuState = { x: number; y: number; staple: GroceryStaple };

function Groceries(){
    const hid = useHouseholdId();
    const members = useMembers();
    const { staples, items } = useGroceries();
    const me = auth.currentUser!.uid;

    const [stapleDraft, setStapleDraft] = useState("");
    const [itemDraft, setItemDraft] = useState("");
    const [menu, setMenu] = useState<MenuState | null>(null);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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
            await addDoc(stapleCol, { name, needed: false, createdAt: Timestamp.now() });
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
            });
        } catch (err) { console.error(err); }
    }

    async function removeItem(id: string){
        try {
            await deleteDoc(doc(itemCol, id));
        } catch (err) { console.error(err); }
    }

    // Left column on desktop: the checkbox list
    const staplesBody = (
        <>
            <form className="groc_add" onSubmit={addStaple}>
                <input
                    placeholder={t("Add a usual item…")}
                    value={stapleDraft}
                    onChange={(e) => setStapleDraft(e.target.value)}
                />
                <button type="submit">{t("Add")}</button>
            </form>
            {sortedStaples.length === 0 && <div className="groc_empty">{t("Nothing here yet.")}</div>}
            {sortedStaples.map((s) => (
                <label
                    key={s.id}
                    className={s.needed ? "groc_row needed" : "groc_row"}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        setMenu({ x: e.clientX, y: e.clientY, staple: s });
                    }}
                >
                    <input type="checkbox" checked={s.needed} onChange={() => toggleStaple(s)} />
                    <span className="groc_name">{s.name}</span>
                </label>
            ))}
            <div className="groc_hint">
                {t("Tick what we're out of. Untick it once bought. Right-click (or long-press) an item to delete it.")}
            </div>
        </>
    );

    // Right column on desktop: the free-text list
    const itemsBody = (
        <>
            <form className="groc_add" onSubmit={addItem}>
                <input
                    placeholder={t("Add an item…")}
                    value={itemDraft}
                    onChange={(e) => setItemDraft(e.target.value)}
                />
                <button type="submit">{t("Add")}</button>
            </form>
            {sortedItems.length === 0 && <div className="groc_empty">{t("Nothing here yet.")}</div>}
            {sortedItems.map((i) => (
                <div key={i.id} className="groc_row">
                    <span className="groc_name">{i.name}</span>
                    <span className="groc_by">{nameOf(i.addedBy)}</span>
                    <button className="groc_remove" title={t("Remove")} onClick={() => removeItem(i.id)}>✕</button>
                </div>
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
                    onDelete={() => deleteDoc(doc(stapleCol, menu.staple.id)).catch(console.error)}
                />
            )}
        </div>
    )
}

export { Groceries }