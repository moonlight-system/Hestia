import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useHouseholdId } from "./HouseholdContext";
import type { GroceryItem, GroceryStaple } from "./Types";

export function useGroceries(): { staples: GroceryStaple[]; items: GroceryItem[] } {
    const hid = useHouseholdId();
    const [staples, setStaples] = useState<GroceryStaple[]>([]);
    const [items, setItems] = useState<GroceryItem[]>([]);

    useEffect(() => {
        return onSnapshot(
            collection(db, "households", hid, "groceryStaples"),
            (snap) => setStaples(snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    name: data.name,
                    forId: data.forId,
                    needed: !!data.needed,
                    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
                };
            })),
            (err) => console.error("Grocery staples listener failed:", err),
        );
    }, [hid]);

    useEffect(() => {
        return onSnapshot(
            collection(db, "households", hid, "groceryItems"),
            (snap) => setItems(snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    name: data.name,
                    forId: data.forId,
                    addedBy: data.addedBy,
                    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
                };
            })),
            (err) => console.error("Grocery items listener failed:", err),
        );
    }, [hid]);

    return { staples, items };
}