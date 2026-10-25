import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, Timestamp, where } from "firebase/firestore";
import { db } from "./firebase";
import { useHouseholdId } from "./HouseholdContext";
import { addDays } from "./calendarUtils";
import type { Event } from "./Types";

// Loads one calendar year at a time (plus a margin for weeks that spill over
// into the neighbouring years). Navigating within a year costs no extra reads;
// moving to another year re-queries.
export function useEvents(year: number): Event[] {
    const hid = useHouseholdId();
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        const from = addDays(new Date(year, 0, 1), -45);
        const to = addDays(new Date(year + 1, 0, 1), 45);

        const q = query(
            collection(db, "households", hid, "events"),
            where("start", ">=", Timestamp.fromDate(from)),
            where("start", "<", Timestamp.fromDate(to)),
            orderBy("start"),
        );

        return onSnapshot(
            q,
            (snap) => {
                setEvents(snap.docs.map((d) => {
                    const data = d.data();
                    return {
                        id: d.id,
                        name: data.name,
                        start: data.start.toDate(),
                        end: data.end ? data.end.toDate() : undefined,
                        person: data.person ?? [],
                    } as Event;
                }));
            },
            (err) => console.error("Events listener failed:", err),
        );
    }, [hid, year]);

    return events;
}