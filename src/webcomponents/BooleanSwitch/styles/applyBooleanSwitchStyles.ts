import { getBooleanSwitchStyles } from "./getBooleanSwitchStyles";

/** Creates a style element and appends it to the shadow root. */
export function applyBooleanSwitchStyles(shadowRoot: ShadowRoot): void {
    if (!shadowRoot) {
        console.error("[BooleanSwitchStyles] Cannot apply styles: ShadowRoot is null.");
        return;
    }
    const style = document.createElement("style");
    style.textContent = getBooleanSwitchStyles();
    shadowRoot.appendChild(style);
}