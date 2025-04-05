import { pluginState } from "../../../pluginState";

/**
 * Calculates the effective date to use for data operations.
 * @param initialDate - The date value from the component's 'date' attribute ("YYYY-MM-DD" or "@date").
 * @returns The effective date string (YYYY-MM-DD).
 */
export function calculateEffectiveDate(initialDate: string): string {
    const effectiveDate = initialDate === "@date" ? pluginState.selectedDate : initialDate;
    //& console.log(`[CalculateEffectiveDate] Calculated: ${effectiveDate} (Initial: ${initialDate}, Global: ${pluginState.selectedDate})`);
    return effectiveDate;
}