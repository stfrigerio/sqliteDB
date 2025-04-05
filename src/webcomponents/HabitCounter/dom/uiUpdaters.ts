//? Interface defining the elements needed by UI updaters.
export interface HabitCounterUIElements {
    wrapper: HTMLElement | null;
    valueDisplay: HTMLElement | null;
    labelElement: HTMLElement | null;
    minusButton: HTMLButtonElement | null;
    plusButton: HTMLButtonElement | null;
}

/** Updates the text content of the value display. */
export function updateDisplayValue(elements: HabitCounterUIElements, newValue: number | string): void {
   //& console.log(`[HabitCounterUI] updateDisplayValue called with: ${newValue}`);
    if (elements.valueDisplay) {
        elements.valueDisplay.textContent = String(newValue);
    } else {
        console.error("[HabitCounterUI] valueDisplay element not found for update.");
    }
}

export function updateStaticUI(elements: HabitCounterUIElements, emoji: string, habitKey: string): void {
    if (elements.labelElement) {
        const newLabelText = `${emoji} ${habitKey}:`;
        console.log(`[HabitCounterUI] DEBUG: Attempting to set label textContent to: "${newLabelText}"`);
        elements.labelElement.textContent = newLabelText;
    } else {
        console.error("[HabitCounterUI] updateStaticUI: labelElement was null.");
    }
    if (elements.minusButton) {
        elements.minusButton.setAttribute("aria-label", `Decrease ${habitKey} value`);
    }
    if (elements.plusButton) {
        elements.plusButton.setAttribute("aria-label", `Increase ${habitKey} value`);
    }
}

/** Sets the component to visually indicate an error state. */
export function setComponentErrorState(elements: HabitCounterUIElements, message: string = "Error"): void {
    //& console.warn(`[HabitCounterUI] setComponentErrorState called with message: "${message}"`);
    updateDisplayValue(elements, "ERR");
    if (elements.wrapper) {
        elements.wrapper.style.borderColor = "var(--text-error)";
        elements.wrapper.style.backgroundColor = "var(--background-secondary-alt)";
        elements.wrapper.setAttribute("title", message);
    }
}

/** Clears any visual error indication. */
export function clearComponentErrorState(elements: HabitCounterUIElements): void {
    //& console.log(`[HabitCounterUI] clearComponentErrorState called.`);
    //? Only reset if actually in error state (check border color)
    if (elements.wrapper && elements.wrapper.style.borderColor !== "transparent") {
        elements.wrapper.style.borderColor = "transparent";
        elements.wrapper.style.backgroundColor = "";
        elements.wrapper.removeAttribute("title");
    }
}