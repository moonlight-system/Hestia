import { createContext, useContext } from "react";

export const HouseholdContext = createContext<string | null>(null);

export function useHouseholdId(): string {
    const id = useContext(HouseholdContext);
    if (!id) throw new Error("useHouseholdId must be used inside a household");
    return id;
}