import type { TextInputDOMElements } from "../TextInput.types";

/** Updates the value displayed in the input element. */
export function updateInputValue(elements: TextInputDOMElements, newValue: string): void {
    if (elements.inputElement && elements.inputElement.value !== newValue) {
        elements.inputElement.value = newValue;
    } else if (!elements.inputElement) {
        console.error("[TextInputUI] inputElement not found for value update.");
    }
}

/** Updates static UI parts like the label text. */
export function updateStaticTextUI(elements: TextInputDOMElements, label?: string): void {
    if (elements.labelElement && label) {
        elements.labelElement.textContent = label;
    }
    //? Could add updates for aria-labels here if needed
}

/** Sets the component to visually indicate an error state and disables input/button. */
export function setTextErrorState(hostElement: HTMLElement, elements: TextInputDOMElements, message: string = "Error"): void {
    if (elements.inputElement) {
        elements.inputElement.disabled = true; // Disable input on error
        elements.inputElement.style.borderColor = "var(--text-error)"; // Example styling
    }
    if (elements.modalTriggerElement && elements.modalTriggerElement !== elements.inputElement) {
        // Disable separate button if it exists
        (elements.modalTriggerElement as HTMLButtonElement).disabled = true;
        (elements.modalTriggerElement as HTMLButtonElement).style.borderColor = "var(--text-error)";
    }
    hostElement.classList.add('error');
    hostElement.setAttribute('aria-disabled', 'true'); // Indicate disabled state
    hostElement.setAttribute('title', message);
}

/** Clears any visual error indication and enables input/button. */
export function clearTextErrorState(hostElement: HTMLElement, elements: TextInputDOMElements): void {
    if (elements.inputElement) {
        elements.inputElement.disabled = false;
        elements.inputElement.style.borderColor = ""; // Reset border
    }
    if (elements.modalTriggerElement && elements.modalTriggerElement !== elements.inputElement) {
        (elements.modalTriggerElement as HTMLButtonElement).disabled = false;
        (elements.modalTriggerElement as HTMLButtonElement).style.borderColor = "";
    }
    hostElement.classList.remove('error');
    hostElement.removeAttribute('aria-disabled');
    hostElement.removeAttribute('title');
}