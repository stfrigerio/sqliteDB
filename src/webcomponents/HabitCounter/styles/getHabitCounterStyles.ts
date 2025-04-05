/** Returns the CSS string for the component's Shadow DOM. */
export function getHabitCounterStyles(): string {
    //& console.log("[HabitCounterStyles] getHabitCounterStyles called.");
    
    return `
        :host { display: inline-flex; vertical-align: middle; }
        .habit-wrapper {
            display: flex; align-items: center; gap: 0.5em;
            font-family: var(--font-text); padding: 2px 5px;
            border: 1px solid transparent; border-radius: 4px;
            transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out;
        }
        .habit-label { white-space: nowrap; }
        button {
            background-color: var(--background-secondary); color: var(--text-normal);
            border: 1px solid var(--background-modifier-border); padding: 1px 7px;
            font-size: var(--font-ui-small); cursor: pointer; font-weight: bold;
            border-radius: 4px; line-height: 1.2; min-width: 20px;
        }
        button:hover {
            background-color: var(--background-modifier-hover); border-color: var(--interactive-accent-hover);
            color: var(--text-accent-hover);
        }
        button:active { background-color: var(--background-modifier-active); color: var(--text-accent); }
        .habit-value {
            min-width: 2ch; text-align: center; font-weight: bold;
            padding: 0 2px; color: var(--text-normal);
        }
    `;
}