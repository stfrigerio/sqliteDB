/** Returns CSS string for the TextInput component's Shadow DOM. */
export function getTextInputStyles(): string {
    return `
        :host {
            display: inline-flex; /* Or block, depending on desired layout */
            flex-direction: column; /* Stack label and input/button */
            gap: var(--size-4-1); /* Space between label and input row */
            font-family: var(--font-text);
            width: 100%; /* Default to full width, can be overridden */
        }

        .input-wrapper {
            display: flex;
            align-items: stretch; /* Make input and button same height */
            width: 100%;
        }

        /* Optional Label Styling */
        .input-label {
            font-size: var(--font-ui-small);
            font-weight: var(--font-semibold);
            color: var(--text-muted);
            padding-left: var(--size-4-2); /* Indent slightly */
            margin-bottom: -var(--size-4-1); /* Pull input closer if label exists */
        }

        /* Main Input Element Styling */
        input[type="text"].main-input {
            flex-grow: 1; /* Take available space */
            border: 1px solid var(--background-modifier-border);
            border-radius: var(--radius-m);
            padding: var(--size-4-2) var(--size-4-3);
            font-size: var(--font-ui-normal);
            background-color: var(--background-secondary);
            color: var(--text-normal);
            min-width: 50px; /* Prevent collapsing too small */
            transition: border-color 0.1s ease-in-out;
        }
        input[type="text"].main-input:focus {
            outline: none;
            border-color: var(--interactive-accent);
            box-shadow: 0 0 0 2px var(--interactive-accent-translucent);
        }
        input[type="text"].main-input::placeholder {
            color: var(--text-faint);
            opacity: 0.8;
        }

                input[type="text"].main-input {
            /* ... existing input styles ... */
            /* //? Default cursor */
            cursor: text;
        }

        /* //^ Styles for Button Mode */
        :host([data-button-mode="true"]) input[type="text"].main-input {
            cursor: pointer; /* Indicate clickability */
        }
        :host([data-button-mode="true"]) input[type="text"].main-input:hover {
            background-color: var(--background-modifier-hover);
        }
        /* //? Hide the separate trigger button in button mode */
        :host([data-button-mode="true"]) button.modal-trigger {
            display: none;
        }
        /* //? Ensure input border radius is correct in button mode */
        :host([data-button-mode="true"]) input[type="text"].main-input {
            border-top-right-radius: var(--radius-m);
            border-bottom-right-radius: var(--radius-m);
        }

        /* Modal Trigger Button Styling (if used) */
        button.modal-trigger {
            flex-shrink: 0; /* Don't shrink the button */
            border: 1px solid var(--background-modifier-border);
            border-left: none; /* Join with input */
            background-color: var(--background-secondary);
            color: var(--text-muted);
            padding: 0 var(--size-4-3);
            cursor: pointer;
            border-top-right-radius: var(--radius-m);
            border-bottom-right-radius: var(--radius-m);
            font-size: var(--font-ui-small);
            display: flex;
            align-items: center;
            justify-content: center;
        }
         /* Adjust input border radius when button is present */
        input[type="text"].main-input + button.modal-trigger {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        }

        button.modal-trigger:hover {
            background-color: var(--background-modifier-hover);
            color: var(--text-normal);
        }
        button.modal-trigger:active {
            background-color: var(--background-modifier-active);
        }

        /* Styling when input itself is the trigger (no separate button) */
        :host([data-input-as-trigger="true"]) input[type="text"].main-input {
            cursor: pointer; /* Indicate clickability */
            /* Optionally change appearance slightly */
             /* background-image: url('data:image/svg+xml,...'); // Add dropdown arrow */
        }
        :host([data-input-as-trigger="true"]) input[type="text"].main-input:hover {
             /* background-color: var(--background-modifier-hover); // Subtle hover on input */
        }


        /* Error State */
        :host(.error) input[type="text"].main-input,
        :host(.error) button.modal-trigger {
            border-color: var(--text-error);
        }
        :host(.error) input[type="text"].main-input:focus {
            box-shadow: 0 0 0 2px var(--text-error-translucent);
        }

        /* Disabled State */
        :host([aria-disabled="true"]) {
            opacity: 0.6;
            cursor: not-allowed;
        }
        :host([aria-disabled="true"]) input[type="text"].main-input,
        :host([aria-disabled="true"]) button.modal-trigger {
            background-color: var(--background-modifier-border-hover);
            cursor: not-allowed;
        }
    `;
}