import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useHouseholdId } from "./HouseholdContext";
import type { Debt } from "./Types";

export function useDebts(): Debt[] {
    const hid = useHouseholdId();
    const [debts, setDebts] = useState<Debt[]>([]);

    useEffect(() => {
        return onSnapshot(
            collection(db, "households", hid, "debts"),
            (snap) => {
                setDebts(snap.docs.map((d) => {
                    const data = d.data();
                    return {
                        id: d.id,
                        debtor: data.debtor,
                        creditor: data.creditor,
                        kind: data.kind ?? "money",
                        cents: data.cents,
                        what: data.what,
                        description: data.description,
                        paid: !!data.paid,
                        paidAt: data.paidAt ? data.paidAt.toDate() : undefined,
                        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0),
                    } as Debt;
                }));
            },
            (err) => console.error("Debts listener failed:", err),
        );
    }, [hid]);

    return debts;
}