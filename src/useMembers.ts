import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useHouseholdId } from "./HouseholdContext";
import type { Person } from "./Types";

export function useMembers(): Person[] {
    const hid = useHouseholdId();
    const [members, setMembers] = useState<Person[]>([]);

    useEffect(() => {
        return onSnapshot(
            collection(db, "households", hid, "members"),
            (snap) => {
                setMembers(snap.docs.map((d) => ({
                    id: d.id,
                    name: d.data().name,
                    color: d.data().color,
                })));
            },
            (err) => console.error("Members listener failed:", err),
        );
    }, [hid]);

    return members;
}