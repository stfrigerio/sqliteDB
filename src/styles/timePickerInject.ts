const STYLE_ID = "sqlite-db-time-picker-styles";

function getTimePickerStyles(): string {
    return `
        .time-picker-modal-content {
            padding: var(--size-4-4) var(--size-4-6);
        }
        .time-picker-modal-content h2 {
            text-align: center;
            margin-bottom: var(--size-4-4);
        }
        /* Style the setting containing the dropdowns */
        .time-picker-controls .setting-item-control {
            display: flex;
            justify-content: center; /* Center the dropdowns */
            align-items: center;
            gap: var(--size-4-1); /* Space between hour, :, minute */
        }
        .time-picker-select {
            min-width: 60px; /* Give dropdowns some width */
            text-align: center;
        }
        .time-picker-separator {
            font-size: var(--font-ui-large);
            font-weight: bold;
            line-height: var(--input-height); /* Align with dropdowns */
            padding: 0 var(--size-4-1);
        }
         /* Style the setting containing the buttons */
        .time-picker-actions {
            margin-top: var(--size-4-4);
            border-top: 1px solid var(--background-modifier-border);
            padding-top: var(--size-4-3);
        }
        .time-picker-actions .setting-item-control {
             justify-content: flex-end; /* Align buttons right */
        }
    `;
}

/** Injects CSS for the Time Picker modal into the document head. */
export function injectTimePickerStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = getTimePickerStyles();
    document.head.appendChild(styleEl);
}

/** Removes the injected Time Picker styles. */
export function removeTimePickerStyles(): void {
    const styleEl = document.getElementById(STYLE_ID);
    if (styleEl) styleEl.remove();
}