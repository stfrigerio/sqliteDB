import type { TextInputConfig, TextInputDOMElements } from "../TextInput.types";
import type { InputChangeEventHandler } from "../eventHandlers/inputHandlers";
import type { ModalTriggerHandler } from "../eventHandlers/modalTriggerHandlers";

//? Interface for handlers needed by the DOM builder
export interface TextInputDOMHandlers {
    handleInputChange: InputChangeEventHandler;
    handleModalTrigger: ModalTriggerHandler;
}

/**
 * Builds the Shadow DOM structure for the TextInput component.
 * @param shadowRoot The ShadowRoot to append elements to.
 * @param config Configuration options from attributes.
 * @param handlers Event handlers for input change and modal trigger.
 * @returns Object containing references to the created UI elements.
 */
export function buildTextInputDOM(
    shadowRoot: ShadowRoot,
    config: TextInputConfig,
    handlers: TextInputDOMHandlers
): TextInputDOMElements {
    if (!shadowRoot) throw new Error("Cannot build DOM: ShadowRoot is null.");

    //? Determine if a separate button is needed *initially*
    //? Button mode overrides this later if needed
    const needsSeparateButton = config.modalType && config.modalType !== 'none' && !config.isButton;

    // --- Optional Label ---
    let labelElement: HTMLLabelElement | null = null;
    if (config.label) {
        labelElement = document.createElement("label");
        labelElement.textContent = config.label;
        labelElement.className = "input-label";
        //? Associate label with input later via ID
        shadowRoot.appendChild(labelElement); // Append label first if present
    }

    // --- Wrapper for Input and (optional) Button ---
    const inputWrapper = document.createElement("div");
    inputWrapper.className = "input-wrapper";

    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.className = "main-input";
    inputElement.value = config.initialValueAttr ?? ""; // Use value from attribute initially
    inputElement.placeholder = config.placeholder ?? "";

    //^ Apply button mode logic
    if (config.isButton) {
        inputElement.readOnly = true; // Make input non-editable
        //? Attach modal trigger directly to input click
        inputElement.addEventListener("click", handlers.handleModalTrigger);
        //? Add data attribute to host for styling
        (shadowRoot.host as HTMLElement).dataset.buttonMode = 'true';
    } else {
        //? Normal input mode - listen for changes
        inputElement.addEventListener("change", handlers.handleInputChange);
    }

    // ... (associate label if present) ...
    inputWrapper.appendChild(inputElement);

    let modalTriggerElement: HTMLElement = inputElement; // Default trigger is input

    //^ Create separate button only if needed AND not in button mode
    if (needsSeparateButton) {
        const buttonElement = document.createElement("button");
        // ... (create button content/attributes) ...
        buttonElement.addEventListener("click", handlers.handleModalTrigger);
        inputWrapper.appendChild(buttonElement);
        modalTriggerElement = buttonElement; // Button is now the trigger
    }

    shadowRoot.appendChild(inputWrapper);

    return {
        wrapper: shadowRoot.host as HTMLElement,
        labelElement,
        inputElement,
        modalTriggerElement // Might be input or button depending on mode
    };
}