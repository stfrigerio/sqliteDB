import type { ChangeEventHandler } from "../eventHandlers/changeHandler"; // Import type

//? Type defining the UI Elements specific to the BooleanSwitch
export interface BooleanSwitchUIElements {
    wrapper: HTMLElement; // The main host element might act as wrapper
    labelElement: HTMLLabelElement; // Use label for accessibility
    checkboxElement: HTMLInputElement;
}

/**
 * Builds the Shadow DOM structure for the boolean switch.
 * @param shadowRoot - The ShadowRoot to append elements to.
 * @param uniqueId - A unique ID for linking label and input.
 * @param changeHandler - The function to call when the checkbox state changes.
 * @returns An object containing references to the created UI elements.
 */
export function buildBooleanSwitchDOM(
    shadowRoot: ShadowRoot,
    uniqueId: string, // Needed for label 'for' attribute
    changeHandler: ChangeEventHandler
): BooleanSwitchUIElements {
    if (!shadowRoot) throw new Error("Cannot build DOM: ShadowRoot is null.");

    const wrapper = document.createElement("div"); // Use an inner wrapper if needed, or style host directly
    wrapper.className = "switch-wrapper";

    // --- Checkbox Input (The actual switch mechanism) ---
    const checkboxElement = document.createElement("input");
    checkboxElement.type = "checkbox";
    checkboxElement.id = `bool-switch-${uniqueId}`; // Unique ID
    checkboxElement.className = "bool-switch-input";
    checkboxElement.setAttribute("role", "switch"); // ARIA role
    checkboxElement.addEventListener("change", changeHandler);

    // --- Label (Emoji + Text, associated with checkbox) ---
    const labelElement = document.createElement("label");
    labelElement.htmlFor = checkboxElement.id; // Link label to input
    labelElement.className = "switch-label";
    //? Text content will be set by the component later

    //? Append in desired visual order (Label first, then Switch)
    wrapper.append(labelElement, checkboxElement);
    shadowRoot.append(wrapper);

    return { wrapper, labelElement, checkboxElement };
}