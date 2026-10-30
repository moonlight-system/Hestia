import { useEffect, useMemo, useState } from "react";
import {
    collection, onSnapshot, orderBy, query, Timestamp, where,
    type DocumentData, type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { useHouseholdId } from "./HouseholdContext";
import { addDays, expandEvent } from "./calendarUtils";
import type { Event } from "./Types";

function toEvent(d: QueryDocumentSnapshot<DocumentData>): Event {
    const data = d.data();
    const start: Date = data.start.toDate();
    const doneAt: number[] = data.doneAt ?? [];
    return {
        id: d.id,
        name: data.name,
        start,
        end: data.end ? data.end.toDate() : undefined,
        person: data.person ?? [],
        repeat: data.repeat,
        doneAt,
        done: doneAt.includes(start.getTime()),   // right for one-off events
    } as Event;
}

// One calendar year plus a margin for weeks that spill into the neighbouring years
function rangeFor(year: number): [Date, Date] {
    return [addDays(new Date(year, 0, 1), -45), addDays(new Date(year + 1, 0, 1), 45)];
}

// Loads one calendar year of one-off events, plus ALL repeating events (they can
// have started years ago), which are expanded into occurrences for that year.
export function useEvents(year: number): Event[] {
    const hid = useHouseholdId();
    const [single, setSingle] = useState<Event[]>([]);
    const [repeating, setRepeating] = useState<Event[]>([]);

    useEffect(() => {
        const [from, to] = rangeFor(year);
        const q = query(
            collection(db, "households", hid, "events"),
            where("start", ">=", Timestamp.fromDate(from)),
            where("start", "<", Timestamp.fromDate(to)),
            orderBy("start"),
        );
        return onSnapshot(
            q,
            // Repeating events are handled by the other listener
            (snap) => setSingle(snap.docs.map(toEvent).filter((e) => !e.repeat)),
            (err) => console.error("Events listener failed:", err),
        );
    }, [hid, year]);

    useEffect(() => {
        const q = query(
            collection(db, "households", hid, "events"),
            where("repeats", "==", true),
        );
        return onSnapshot(
            q,
            (snap) => setRepeating(snap.docs.map(toEvent)),
            (err) => console.error("Repeating events listener failed:", err),
        );
    }, [hid]);

    return useMemo(() => {
        const [from, to] = rangeFor(year);
        return [...single, ...repeating.flatMap((ev) => expandEvent(ev, from, to))]
            .sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [single, repeating, year]);
}