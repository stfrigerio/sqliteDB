import type { HabitCounterUIElements } from "./uiUpdaters";

//? Defines the expected structure for event handlers passed to the builder.
export interface HabitCounterEventHandlers {
    handleDecrement: () => void;
    handleIncrement: () => void;
}

/**
 * Builds the Shadow DOM structure for the habit counter.
 * @param shadowRoot - The ShadowRoot to append elements to.
 * @param handlers - Object containing click handler functions.
 * @returns An object containing references to the created UI elements.
 */
export function buildHabitCounterDOM(
    shadowRoot: ShadowRoot,
    handlers: HabitCounterEventHandlers
): HabitCounterUIElements {
    if (!shadowRoot) throw new Error("Cannot build DOM: ShadowRoot is null.");
    if (!handlers || typeof handlers.handleDecrement !== 'function' || typeof handlers.handleIncrement !== 'function') {
        throw new Error("Cannot build DOM: Invalid event handlers provided.");
    }

    const wrapper = document.createElement("div");
    wrapper.className = "habit-wrapper";

    const labelElement = document.createElement("span");
    labelElement.className = "habit-label";

    const minusButton = document.createElement("button");
    minusButton.textContent = "−";
    minusButton.addEventListener('click', handlers.handleDecrement);

    const plusButton = document.createElement("button");
    plusButton.textContent = "+";
    plusButton.addEventListener('click', handlers.handleIncrement);

    const valueDisplay = document.createElement("span");
    valueDisplay.className = "habit-value";
    valueDisplay.textContent = "..."; //? Initial loading state

    wrapper.append(labelElement, minusButton, valueDisplay, plusButton);
    shadowRoot.append(wrapper);

    //? Return references to the important elements
    return { wrapper, valueDisplay, labelElement, minusButton, plusButton };
}