import type { BooleanSwitchUIElements } from "./buildBooleanSwitchDOM";

/** Updates the checked state of the switch input. */
export function updateSwitchState(elements: BooleanSwitchUIElements, isChecked: boolean): void {
    if (elements.checkboxElement) {
        elements.checkboxElement.checked = isChecked;
        elements.checkboxElement.setAttribute("aria-checked", String(isChecked));
    } else {
        console.error("[BooleanSwitchUI] checkboxElement not found for state update.");
    }
}

/** Updates label text based on component state. */
export function updateStaticBooleanUI(elements: BooleanSwitchUIElements, emoji: string, key: string): void {
    if (elements.labelElement) {
        elements.labelElement.textContent = `${emoji} ${key}:`;
    } else {
        console.error("[BooleanSwitchUI] labelElement not found for static update.");
    }
}

/** Sets the component to visually indicate an error state and disables the switch. */
export function setBooleanSwitchErrorState(hostElement: HTMLElement, elements: BooleanSwitchUIElements, message: string = "Error"): void {
    if (elements.checkboxElement) {
        elements.checkboxElement.disabled = true;
    }
    hostElement.classList.add('error'); // Add error class to host for potential styling
    hostElement.setAttribute('aria-disabled', 'true');
    hostElement.setAttribute('title', message); // Tooltip for error details
}

/** Clears any visual error indication and enables the switch. */
export function clearBooleanSwitchErrorState(hostElement: HTMLElement, elements: BooleanSwitchUIElements): void {
    if (elements.checkboxElement) {
        elements.checkboxElement.disabled = false;
    }
    hostElement.classList.remove('error');
    hostElement.removeAttribute('aria-disabled');
    hostElement.removeAttribute('title');
}