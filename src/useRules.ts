import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useHouseholdId } from "./HouseholdContext";
import type { Rule } from "./Types";

export function useRules(): Rule[] {
    const hid = useHouseholdId();
    const [rules, setRules] = useState<Rule[]>([]);

    useEffect(() => {
        return onSnapshot(
            collection(db, "households", hid, "rules"),
            (snap) => {
                setRules(snap.docs.map((d) => {
                    const data = d.data();
                    return {
                        id: d.id,
                        name: data.name,
                        description: data.description,
                        agreed: data.agreed ?? [],
                        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
                    } as Rule;
                }));
            },
            (err) => console.error("Rules listener failed:", err),
        );
    }, [hid]);

    return rules;
}