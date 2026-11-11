import { useSyncExternalStore } from "react";
import { TRANSLATIONS } from "./translations";

// To add a language: add a line here AND a block in translations.ts.
// `locale` controls date/time/number formatting (day names, 24h clock...).
export const LANGUAGES = [
    { id: "en", label: "English", locale: "en-GB" },   // en-GB = 24h clock, day before month
    { id: "fr", label: "Français", locale: "fr-FR" },
    { id: "es", label: "Español", locale: "es-ES" },
];

// Amounts are stored in cents, so only 2-decimal currencies belong here (no JPY).
export const CURRENCIES = [
    { id: "EUR", label: "Euro (EUR)" },
    { id: "USD", label: "US dollar (USD)" },
    { id: "GBP", label: "Pound sterling (GBP)" },
    { id: "CHF", label: "Swiss franc (CHF)" },
    { id: "CAD", label: "Canadian dollar (CAD)" },
];

let lang = "en";
let currency = "EUR";
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

export function setI18n(l: string, c: string) {
    const nl = LANGUAGES.some((x) => x.id === l) ? l : "en";
    const nc = CURRENCIES.some((x) => x.id === c) ? c : "EUR";
    if (nl === lang && nc === currency) return;
    lang = nl;
    currency = nc;
    document.documentElement.lang = nl;
    listeners.forEach((f) => f());
}

// Call once, at the top of <App/>: re-renders the whole tree when language/currency change
export function useI18n(): string {
    return useSyncExternalStore(subscribe, () => `${lang}|${currency}`);
}

export function t(key: string, vars?: Record<string, string | number>): string {
    let s = TRANSLATIONS[lang]?.[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
}

export const locale = () => LANGUAGES.find((x) => x.id === lang)?.locale ?? "en-GB";
export const currencyCode = () => currency;