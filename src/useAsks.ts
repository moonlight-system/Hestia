import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { useHouseholdId } from "./HouseholdContext";
import type { Ask } from "./Types";

export function useAsks(): Ask[] {
    const hid = useHouseholdId();
    const [asks, setAsks] = useState<Ask[]>([]);

    useEffect(() => {
        const q = query(
            collection(db, "households", hid, "asks"),
            orderBy("createdAt", "desc"),
        );
        return onSnapshot(
            q,
            (snap) => {
                setAsks(snap.docs.map((d) => {
                    const data = d.data();
                    return {
                        id: d.id,
                        author: data.author,
                        content: data.content,
                        vote: !!data.vote,
                        text: !!data.text,
                        answers: data.answers ?? {},
                        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
                    } as Ask;
                }));
            },
            (err) => console.error("Asks listener failed:", err),
        );
    }, [hid]);

    return asks;
}