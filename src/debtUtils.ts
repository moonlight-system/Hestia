import type { Debt, Person } from "./Types";

export type Transfer = { from: Person; to: Person; cents: number };

export function formatMoney(cents: number): string {
    return new Intl.NumberFormat([], { style: "currency", currency: "EUR" }).format(cents / 100);
}

// True if the debts contain a loop: money going both ways between two people,
// or a longer circle like A owes B owes C owes A.
export function hasCycle(debts: Debt[]): boolean {
    const next = new Map<string, string[]>();
    for (const d of debts) {
        const list = next.get(d.debtor.id) ?? [];
        list.push(d.creditor.id);
        next.set(d.debtor.id, list);
    }

    // Depth-first search: state 1 = on the current path, 2 = fully explored.
    // Meeting a node that is on the current path means we walked in a circle.
    const state = new Map<string, 1 | 2>();
    function visit(id: string): boolean {
        state.set(id, 1);
        for (const to of next.get(id) ?? []) {
            const s = state.get(to);
            if (s === 1) return true;
            if (!s && visit(to)) return true;
        }
        state.set(id, 2);
        return false;
    }

    for (const id of next.keys()) {
        if (!state.has(id) && visit(id)) return true;
    }
    return false;
}

// Nets everything out: each person ends up either owing or being owed,
// and the biggest debtors pay the biggest creditors first.
export function simplify(debts: Debt[]): Transfer[] {
    const net = new Map<string, number>();     // positive = is owed, negative = owes
    const people = new Map<string, Person>();

    for (const d of debts) {
        if (d.kind !== "money" || !d.cents) continue;
        people.set(d.debtor.id, d.debtor);
        people.set(d.creditor.id, d.creditor);
        net.set(d.creditor.id, (net.get(d.creditor.id) ?? 0) + d.cents);
        net.set(d.debtor.id, (net.get(d.debtor.id) ?? 0) - d.cents);
    }

    const side = (sign: 1 | -1) =>
        [...net.entries()]
            .filter(([, v]) => v * sign > 0)
            .map(([id, v]) => ({ id, left: Math.abs(v) }))
            .sort((a, b) => b.left - a.left || a.id.localeCompare(b.id));

    const owing = side(-1);
    const owed = side(1);
    const out: Transfer[] = [];

    let i = 0, j = 0;
    while (i < owing.length && j < owed.length) {
        const pay = Math.min(owing[i].left, owed[j].left);
        out.push({ from: people.get(owing[i].id)!, to: people.get(owed[j].id)!, cents: pay });
        owing[i].left -= pay;
        owed[j].left -= pay;
        if (owing[i].left === 0) i++;
        if (owed[j].left === 0) j++;
    }
    return out;
}