
export type Person = {
    id: string;
    name: string;
    color?: string;
}

export type Repeat = { every: number; unit: "days" | "weeks" | "months" };
export type TaskMode = "anyone" | "assigned" | "each";

export type Task = {
    id: string;
    name: string;
    description?: string;
    mode: TaskMode;
    assignee?: Person;        // mode "assigned"
    participants: Person[];   // mode "each"
    repeat?: Repeat;          // absent = one-time task
    date?: Date;              // due date (first due date if repeating)
    time?: string;
    cycle: number;            // which repetition we're on, 0 = the first
    done: string[];           // ids of the people who ticked it this cycle
    completedAt?: Date;       // one-time tasks only, for the history
    createdAt: Date;
};

export type EventUnit = "days" | "weeks" | "months" | "years";
export type EventRepeat = { every: number; unit: EventUnit } | { monthDay: number };

export type Event = {
    id: string;
    name: string;
    start: Date;
    end?: Date;
    person?: Person[];
    color?: string;
    repeat?: EventRepeat;
    // Set on each displayed occurrence of a repeating event: the real start/end of the series
    origStart?: Date;
    origEnd?: Date;
}

export type Answer = {
    vote?: boolean;
    text?: string;
}

export type Ask = {
    id: string;
    author: Person;
    content: string;
    vote: boolean;            // this ask collects ✓/✗
    text: boolean;            // this ask collects a text answer (both = both required)
    answers: Record<string, Answer>;   // keyed by roommate id, missing key = empty slot
    createdAt: Date;
}

export type Debt = {
    id: string;
    debtor: Person;           // the one who owes
    creditor: Person;         // the one who is owed
    kind: "money" | "text";
    cents?: number;           // money debts, in cents
    what?: string;            // text debts, e.g. "2 cans of Monster"
    description?: string;
    paid: boolean;
    paidAt?: Date;
    createdAt: Date;
};

export type Rule = {
    id: string;
    name: string;
    description?: string;
    agreed: string[];         // ids of the roommates who agreed to follow it
    createdAt: Date;
};