
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
    cycle: number;            // which repetition we're on, 0 = the first
    done: string[];           // ids of the people who ticked it this cycle
    completedAt?: Date;       // one-time tasks only, for the history
    createdAt: Date;
};

export type Event = {
    id: string;
    name: string;
    start: Date;
    end?: Date;
    person?: Person[];
    color?: string;
}

export type Answer = {
    id: string;
    author: Person;
    value: boolean;
    text?: string;
}

export type Ask = {
    id: string;
    author: Person;
    content: string;
    answers: Answer[];
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