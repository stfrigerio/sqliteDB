//? Define the unique class used by the DateNavigatorRenderer container
//? Define a unique ID for the style tag specific to the navigator
const STYLE_ID = "sqlitedb-date-navigator-styles";
const NAVIGATOR_CONTAINER_WRAPPER_CLASS = "date-navigator-container-wrapper";

/** Returns the CSS string specifically for the Date Navigator component. */
function getDateNavigatorStyles(): string {
    return `
        .${NAVIGATOR_CONTAINER_WRAPPER_CLASS} {
            padding-bottom: var(--size-4-2);
            border-bottom: 1px solid var(--background-modifier-border);
        }

        .${NAVIGATOR_CONTAINER_WRAPPER_CLASS} .date-navigator-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--size-4-2);
        }

        .${NAVIGATOR_CONTAINER_WRAPPER_CLASS} .date-nav-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2rem;
            width: 100%;
        }

        .${NAVIGATOR_CONTAINER_WRAPPER_CLASS} .date-nav-button {
            font-size: 2.5rem;
            width: 3rem;
            height: 3rem;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-normal);
            transition: color 0.2s ease, transform 0.2s ease;
        }

        .${NAVIGATOR_CONTAINER_WRAPPER_CLASS} .date-nav-button:hover {
            color: var(--text-accent);
            transform: scale(1.2);
        }

        .${NAVIGATOR_CONTAINER_WRAPPER_CLASS} h1.date-navigator-display {
            margin: 0;
            text-align: center;
            font-size: var(--font-heading-1);
            color: var(--text-normal);
            white-space: nowrap;
            min-width: 15ch;
            padding: 0 1rem;
        }
    `;
}

/** Injects CSS for the Date Navigator component into the document head if not already present. */
export function injectDateNavigatorStyles(): void {
    if (document.getElementById(STYLE_ID)) {
        return;
    }

    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = getDateNavigatorStyles();
    document.head.appendChild(styleEl);
}

/** Removes the injected Date Navigator styles from the document head. */
export function removeDateNavigatorStyles(): void {
    const styleEl = document.getElementById(STYLE_ID);
    if (styleEl) {
        styleEl.remove();
    }
}