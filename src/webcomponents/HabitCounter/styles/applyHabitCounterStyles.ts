import { getHabitCounterStyles } from "./getHabitCounterStyles";

/** Creates a style element and appends it to the shadow root. */
export function applyHabitCounterStyles(shadowRoot: ShadowRoot): void {
    //& console.log("[HabitCounterStyles] applyHabitCounterStyles called.");
    if (!shadowRoot) {
        console.error("[HabitCounterStyles] Cannot apply styles: ShadowRoot is null.");
        return;
    }
    const style = document.createElement("style");
    style.textContent = getHabitCounterStyles();
    shadowRoot.appendChild(style);
}