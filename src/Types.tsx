
export type Person = {
    id: string;
    name: string;
}

export type Task = {
    id: string;
    name: string;
    person?: Person;
};

export type Event = {
    id: string;
    name: string;
    start: Date;
    end?: Date;
    person?: Person[];
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