/** Returns the CSS string for the BooleanSwitch component's Shadow DOM. */
export function getBooleanSwitchStyles(): string {
    return `
        :host {
            display: inline-flex; /* Align items horizontally */
            align-items: center;
            gap: 0.6em; /* Space between label and switch */
            font-family: var(--font-text);
            cursor: pointer; /* Make the whole thing clickable */
            user-select: none; /* Prevent text selection */
        }

        .switch-wrapper {
             display: contents; /* Don't add extra layout */
        }

        .switch-label {
            /* Styles for the emoji + text label */
            white-space: nowrap;
            color: var(--text-normal);
            line-height: 1.2; /* Align better with switch */
        }

        /* Basic Checkbox Styling (Foundation) */
        input[type="checkbox"] {
            appearance: none; /* Remove default OS styling */
            -webkit-appearance: none;
            -moz-appearance: none;
            position: relative; /* For positioning pseudo-elements */
            width: 36px; /* Width of the switch */
            height: 20px; /* Height of the switch */
            background-color: var(--background-modifier-border); /* Off state background */
            border-radius: 10px; /* Rounded corners */
            cursor: pointer;
            outline: none;
            transition: background-color 0.2s ease-in-out;
            vertical-align: middle; /* Align with text */
            margin: 0; /* Remove default margin */
            flex-shrink: 0; /* Prevent shrinking */
        }

        /* Styling the 'thumb' or 'knob' of the switch */
        input[type="checkbox"]::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 16px; /* Size of the knob */
            height: 16px;
            background-color: var(--background-primary); /* Knob color */
            border-radius: 50%; /* Make it round */
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            transition: transform 0.2s ease-in-out;
        }

        /* Styling when the switch is checked (On state) */
        input[type="checkbox"]:checked {
            background-color: var(--interactive-accent); /* Use accent color for on state */
        }

        /* Moving the knob when checked */
        input[type="checkbox"]:checked::before {
            transform: translateX(16px); /* Move knob to the right */
        }

        /* Focus state for accessibility */
        input[type="checkbox"]:focus-visible {
            box-shadow: 0 0 0 2px var(--background-primary), 0 0 0 4px var(--interactive-accent-hover);
        }

        /* Disabled state */
        input[type="checkbox"]:disabled {
            background-color: var(--background-modifier-border-hover);
            cursor: not-allowed;
            opacity: 0.6;
        }
        input[type="checkbox"]:disabled::before {
            background-color: var(--background-modifier-border);
        }
        :host([aria-disabled="true"]) { /* Style host when disabled */
            cursor: not-allowed;
            opacity: 0.6;
        }

        /* Error state indication (optional, applied to host or wrapper) */
        :host(.error) {
            /* e.g., outline: 1px solid var(--text-error); */
            /* e.g., border-radius: var(--radius-s); */
        }
    `;
}